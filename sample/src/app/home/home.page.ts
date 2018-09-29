import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'angularx-logger';
import { AuthService } from 'ionic-capacitor-oidc-angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public isAuthenticated = false;
  public isExpired = false;

  public user: any;

  private userSubscription = new Subscription();

  constructor(private ngZone: NgZone,
    private logger: Logger,
    private authService: AuthService) { }

  public ngOnInit(): void {
    this.logger.debug('HomePage => ngOnInit');

    this.authService.user$.pipe(
      tap((user) => {
        this.ngZone.run(() => {
          this.user = user;
          this.isAuthenticated = this.authService.isAuthenticated();
          this.isExpired = this.authService.isAccessTokenExpired();
        });
      })
    ).subscribe();
  }

  public ngOnDestroy(): void {
    this.logger.debug('HomePage => ngOnDestroy');

    this.userSubscription.unsubscribe();
  }

  public async login(): Promise<void> {
    this.logger.debug('HomePage => login');

    await this.authService.startAuthentication();
  }

  public async fetchUserInfo(): Promise<void> {
    const info = await this.authService.fetchUserInfo();

    this.logger.debug('fetchUserInfo', info);
  }

  public async logout(): Promise<void> {
    this.logger.debug('HomePage => logout');

    await this.authService.logout();
  }
}
