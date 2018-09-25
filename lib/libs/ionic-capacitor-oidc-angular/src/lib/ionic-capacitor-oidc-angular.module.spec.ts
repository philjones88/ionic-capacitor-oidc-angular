import { async, TestBed } from '@angular/core/testing';
import { IonicCapacitorOidcAngularModule } from './ionic-capacitor-oidc-angular.module';

describe('IonicCapacitorOidcAngularModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [IonicCapacitorOidcAngularModule]
    }).compileComponents();
  }));

  it('should create', () => {
    expect(IonicCapacitorOidcAngularModule).toBeDefined();
  });
});
