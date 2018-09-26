import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AngularRequestor } from './oidc/angular-requestor';
import { AuthService } from './oidc/auth.service';
@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    AuthService,
    AngularRequestor
  ]
})
export class IonicCapacitorOidcAngularModule {}
