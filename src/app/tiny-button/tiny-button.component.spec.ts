import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TinyButtonComponent } from './tiny-button.component';

describe('TinyButtonComponent', () => {
  let component: TinyButtonComponent;
  let fixture: ComponentFixture<TinyButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TinyButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TinyButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
