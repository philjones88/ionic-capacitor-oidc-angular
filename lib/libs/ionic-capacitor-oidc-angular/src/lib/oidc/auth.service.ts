import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Logger } from 'angularx-logger';
import { Plugins } from '@capacitor/core';
import { AngularRequestor } from './angular-requestor';
import { Config } from './config';
import { random } from './random';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
    AuthorizationServiceConfiguration,
    BaseTokenRequestHandler,
    TokenRequest,
    BasicQueryStringUtils,
    GRANT_TYPE_AUTHORIZATION_CODE,
    GRANT_TYPE_REFRESH_TOKEN,
    DefaultCrypto
} from '@openid/appauth';

const { App, Browser, Storage } = Plugins;

@Injectable()
export class AuthService {
    // This is the user's configuration values
    private config: Config;

    // These are the OpenID Connect's server values
    private authConfig: AuthorizationServiceConfiguration;

    public user$: Observable<any>;
    private userSubject = new BehaviorSubject(null);

    private authorizationCode: string;
    public accessToken: string;
    public idToken: string;
    private refreshToken: string;
    public expiresIn: number;
    public issuedAt: number;

    private nonce: string;
    private codeChallenge: string;
    private codeMethod: string;
    private codeVerifier: string;

    private jwtHelperService: JwtHelperService;

    private readonly STORAGE_AUTHORIZATION_CODE = 'oidc-authorization-code';
    private readonly STORAGE_ACCESS_TOKEN = 'oidc-access-token';
    private readonly STORAGE_REFRESH_TOKEN = 'oidc-refresh-token';
    private readonly STORAGE_ID_TOKEN = 'oidc-id-token';
    private readonly STORAGE_EXPIRES_IN = 'oidc-expires-in';
    private readonly STORAGE_ISSUED_AT = 'oidc-issued-at';

    private readonly STORAGE_NONCE = 'oidc-nonce';

    private readonly STORAGE_PKCE_CHALLENGE = 'oidc-pkce-challenge';
    private readonly STORAGE_PKCE_METHOD = 'oidc-pkce-method';
    private readonly STORAGE_PKCE_VERIFIER = 'oidc-pkce-verifier';

    constructor(
        private logger: Logger,
        private angularRequestor: AngularRequestor
    ) {
        this.user$ = this.userSubject.asObservable();
        this.jwtHelperService = new JwtHelperService();
    }

    public async setup(config: Config): Promise<void> {
        this.logger.debug('AuthService => setup => started');

        this.config = config;

        await this.fetchAuthConfig();

        await this.repopulateFromStorage();

        await this.setupRedirectListener();

        this.logger.debug('AuthService => setup => finished');
    }

    public isAuthenticated(): boolean {
        if (this.accessToken && this.refreshToken) {
            this.logger.debug('AuthService => isAuthenticated => true');
            return true;
        }

        this.logger.debug('AuthService => isAuthenticated => false');
        return false;
    }

    public isAccessTokenExpired(): boolean {
        const now = Math.round(new Date().getTime() / 1000);

        if (this.accessToken || (this.issuedAt + this.expiresIn) < now) {
            this.logger.debug('AuthService => isAccessTokenExpired => false');
            return false;
        }

        this.logger.debug('AuthService => isAccessTokenExpired => true');
        return true;
    }

    public getUserInfo(): any {
        const user = this.jwtHelperService.decodeToken(this.idToken);
        this.logger.debug('AuthService => getUserInfo', user);
        return user;
    }

    public async startAuthentication(state?: string): Promise<void> {
        this.logger.debug('startAuth => started');

        // If we're starting authentication, make new nonce + pkce values
        await this.generateNonce();

        await this.generatePKCE();

        const authUrl = encodeURI(this.authConfig.authorizationEndpoint +
            `?client_id=${this.config.clientId}&` +
            `redirect_uri=${this.config.redirectUri}&` +
            `scope=${this.config.scopes.join(' ')}&` +
            'response_type=code id_token&' +
            'response_mode=fragment&' +
            `state=${state || ''}&` +
            `nonce=${this.nonce}&` +
            `code_challenge=${this.codeChallenge}&` +
            `code_challenge_method=${this.codeMethod}`);

        this.logger.debug('startAuth => Opening url', authUrl);

        await Browser.open({ url: authUrl });
    }

    public async fetchNewAccessToken(): Promise<void> {
        this.logger.debug('fetchNewAccessToken => started');

        const handler = new BaseTokenRequestHandler(this.angularRequestor);

        const request = new TokenRequest({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            grant_type: GRANT_TYPE_REFRESH_TOKEN,
            refresh_token: this.refreshToken,
            extras: {
                'code_verifier': this.codeVerifier
            }
        });

        const tokenRequestResult = await handler.performTokenRequest(this.authConfig, request);

        const { accessToken, idToken, expiresIn, issuedAt } = tokenRequestResult;

        this.logger.debug('fetchNewAccessToken => access token', accessToken);
        this.logger.debug('fetchNewAccessToken => id token', idToken);
        this.logger.debug('fetchNewAccessToken => expires in', expiresIn);
        this.logger.debug('fetchNewAccessToken => issued at', issuedAt);

        await Storage.set({ key: this.STORAGE_ACCESS_TOKEN, value: accessToken });
        this.accessToken = accessToken;

        await Storage.set({ key: this.STORAGE_ID_TOKEN, value: idToken });
        this.idToken = idToken;
        this.userSubject.next(this.getUserInfo());

        await Storage.set({ key: this.STORAGE_EXPIRES_IN, value: expiresIn.toString() });
        this.expiresIn = expiresIn;

        await Storage.set({ key: this.STORAGE_ISSUED_AT, value: issuedAt.toString() });
        this.issuedAt = issuedAt;
    }

    private async repopulateFromStorage(): Promise<void> {
        this.logger.debug('AuthService => repopulateFromStorage');

        const accessToken = await Storage.get({ key: this.STORAGE_ACCESS_TOKEN });
        const refreshToken = await Storage.get({ key: this.STORAGE_REFRESH_TOKEN });
        const idToken = await Storage.get({ key: this.STORAGE_ID_TOKEN });
        const expiresIn = await Storage.get({ key: this.STORAGE_EXPIRES_IN });
        const issuedAt = await Storage.get({ key: this.STORAGE_ISSUED_AT });

        const nonce = await Storage.get({ key: this.STORAGE_NONCE });

        const codeChallenge = await Storage.get({ key: this.STORAGE_PKCE_CHALLENGE });
        const codeMethod = await Storage.get({ key: this.STORAGE_PKCE_METHOD });
        const codeVerifier = await Storage.get({ key: this.STORAGE_PKCE_VERIFIER });

        if (accessToken.value) {
            this.logger.debug('AuthService => repopulateFromStorage => access token', accessToken.value);
            this.accessToken = accessToken.value;
        }

        if (refreshToken.value) {
            this.logger.debug('AuthService => repopulateFromStorage => refresh token', refreshToken.value);
            this.refreshToken = refreshToken.value;
        }

        if (idToken.value) {
            this.logger.debug('AuthService => repopulateFromStorage => id token', idToken.value);
            this.idToken = idToken.value;
            this.userSubject.next(this.getUserInfo());
        }

        if (expiresIn.value) {
            this.logger.debug('AuthService => repopulateFromStorage => expires in', expiresIn.value);
            this.expiresIn = parseInt(expiresIn.value, 10);
        }

        if (issuedAt.value) {
            this.logger.debug('AuthService => repopulateFromStorage => issued at', issuedAt.value);
            this.issuedAt = parseInt(issuedAt.value, 10);
        }

        if (nonce.value) {
            this.logger.debug('AuthService => repopulateFromStorage => nonce', nonce.value);
            this.nonce = nonce.value;
        }

        if (codeChallenge.value) {
            this.logger.debug('AuthService => repopulateFromStorage => pkce challenge', codeChallenge.value);
            this.codeChallenge = codeChallenge.value;
        }

        if (codeMethod.value) {
            this.logger.debug('AuthService => repopulateFromStorage => pkce method', codeMethod.value);
            this.codeMethod = codeMethod.value;
        }

        if (codeVerifier.value) {
            this.logger.debug('AuthService => repopulateFromStorage => pkce verifier', codeVerifier.value);
            this.codeVerifier = codeVerifier.value;
        }
    }

    private async generateNonce(): Promise<void> {
        // Generate and store the nonce as per
        // https://auth0.com/docs/api-auth/tutorials/nonce
        const nonce = random();
        this.logger.debug('startAuth => generateNonce => nonce', nonce);
        await Storage.set({ key: this.STORAGE_NONCE, value: nonce });
        this.nonce = nonce;
    }

    private async generatePKCE(): Promise<void> {
        const crypto = new DefaultCrypto();
        const method = 'S256';
        const codeVerifier = await crypto.generateRandom(128);
        const challenge = await crypto.deriveChallenge(codeVerifier);

        this.logger.debug('startAuth => generatePKCE', codeVerifier, challenge, method);

        await Storage.set({ key: this.STORAGE_PKCE_CHALLENGE, value: challenge });
        this.codeChallenge = challenge;

        await Storage.set({ key: this.STORAGE_PKCE_METHOD, value: method });
        this.codeMethod = method;

        await Storage.set({ key: this.STORAGE_PKCE_VERIFIER, value: codeVerifier });
        this.codeVerifier = codeVerifier;
    }

    private async fetchAuthConfig(): Promise<void> {
        this.logger.debug('fetchAuthConfig => started', this.config.oidcServerUrl);

        this.authConfig = await AuthorizationServiceConfiguration.fetchFromIssuer(
            this.config.oidcServerUrl,
            this.angularRequestor
        );

        this.logger.debug('fetchAuthConfig => end', this.authConfig);
    }

    private async setupRedirectListener(): Promise<void> {
        App.addListener('appUrlOpen', async (data) => {
            this.logger.debug('startAuth => appUrlOpen => data', data);

            if (data.url.indexOf(this.config.redirectUri) !== -1) {
                this.logger.debug('startAuth => appUrlOpen => oidc redirect, closing browser');
                await Browser.close();

                const util = new BasicQueryStringUtils();
                const values = util.parseQueryString(data.url.replace(this.config.redirectUri + '#', ''));

                const authorizationCode = values['code'];
                const idToken = values['id_token'];

                await Storage.set({ key: this.STORAGE_AUTHORIZATION_CODE, value: authorizationCode });
                this.authorizationCode = authorizationCode;

                await Storage.set({ key: this.STORAGE_ID_TOKEN, value: idToken });
                this.idToken = idToken;
                this.userSubject.next(this.getUserInfo());

                await this.fetchTokensForAuthorizationCode();
            }
        });

        // TODO: handle the user cancelling the auth process
        Browser.addListener('browserFinished', async (info) => {
            this.logger.debug('startAuth => Browser => browserFinished', info);
            // the user maybe clicked done before finishing?
        });
    }

    private async fetchTokensForAuthorizationCode(): Promise<void> {
        this.logger.debug('fetchTokensForAuthorizationCode => started');

        const handler = new BaseTokenRequestHandler(this.angularRequestor);

        const request = new TokenRequest({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
            code: this.authorizationCode,
            extras: {
                'code_verifier': this.codeVerifier
            }
        });

        const tokenRequestResult = await handler.performTokenRequest(this.authConfig, request);

        const { accessToken, refreshToken, idToken, expiresIn, issuedAt } = tokenRequestResult;

        this.logger.debug('fetchTokensForAuthorizationCode => access token', accessToken);
        this.logger.debug('fetchTokensForAuthorizationCode => refresh token', refreshToken);
        this.logger.debug('fetchTokensForAuthorizationCode => id token', idToken);
        this.logger.debug('fetchTokensForAuthorizationCode => expires in', expiresIn);
        this.logger.debug('fetchTokensForAuthorizationCode => issued at', issuedAt);

        await Storage.set({ key: this.STORAGE_ACCESS_TOKEN, value: accessToken });
        this.accessToken = accessToken;

        await Storage.set({ key: this.STORAGE_REFRESH_TOKEN, value: refreshToken });
        this.refreshToken = refreshToken;

        await Storage.set({ key: this.STORAGE_ID_TOKEN, value: idToken });
        this.idToken = idToken;
        this.userSubject.next(this.getUserInfo());

        await Storage.set({ key: this.STORAGE_EXPIRES_IN, value: expiresIn.toString() });
        this.expiresIn = expiresIn;

        await Storage.set({ key: this.STORAGE_ISSUED_AT, value: issuedAt.toString() });
        this.issuedAt = issuedAt;
    }
}
