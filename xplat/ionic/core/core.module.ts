import { NgModule, Optional, SkipSelf } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { throwIfAlreadyLoaded } from '@ionic-capacitor-oidc-angular/utils';
import { FooCoreModule } from '@ionic-capacitor-oidc-angular/web';

@NgModule({
  imports: [FooCoreModule, IonicModule.forRoot()]
})
export class FooIonicCoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: FooIonicCoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'FooIonicCoreModule');
  }
}
