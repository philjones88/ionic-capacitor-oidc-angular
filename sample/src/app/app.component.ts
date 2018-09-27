import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { SplashScreen } = Plugins;
import { Logger } from 'angularx-logger';
import { AuthService } from 'ionic-capacitor-oidc-angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(private platform: Platform,
    private logger: Logger,
    private authService: AuthService) { }

  public async ngOnInit(): Promise<void> {
    this.logger.debug('AppComponent => ngOnInit');

    await this.platform.ready();

    await SplashScreen.hide();

    await this.initializeApp();

    this.logger.debug('AppComponent => ngOnInit done');
  }

  public ngOnDestroy(): void {
    this.logger.debug('AppComponent => ngOnDestroy');
  }

  public async initializeApp() {
    this.logger.debug('AppComponent => initializeApp');

    await this.authService.setup({
      oidcServerUrl: 'http://localhost:5000',
      clientId: 'oidc-ionic',
      redirectUri: 'com.oidcionic://redirect',
      scopes: ['openid', 'profile', 'api1', 'offline_access']
    });

    const isAuthenticated = this.authService.isAuthenticated();
    const isTokenExpired = this.authService.isAccessTokenExpired();

    if (isAuthenticated && !isTokenExpired) {
      this.logger.debug('AppComponent => logged in and token not expired');
    } else if (isAuthenticated && isTokenExpired) {
      this.logger.debug('AppComponent => already logged in, expired token');
      await this.authService.fetchNewAccessToken();
    } else {
      this.logger.debug('AppComponent => not logged in or expired');
      await this.authService.startAuthentication();
    }

  }
}
