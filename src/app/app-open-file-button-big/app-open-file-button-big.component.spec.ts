import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppOpenFileButtonBigComponent } from './app-open-file-button-big.component';

describe('AppOpenFileButtonBigComponent', () => {
  let component: AppOpenFileButtonBigComponent;
  let fixture: ComponentFixture<AppOpenFileButtonBigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppOpenFileButtonBigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppOpenFileButtonBigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
