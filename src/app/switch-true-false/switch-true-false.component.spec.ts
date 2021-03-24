import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchTrueFalseComponent } from './switch-true-false.component';

describe('SwitchTrueFalseComponent', () => {
  let component: SwitchTrueFalseComponent;
  let fixture: ComponentFixture<SwitchTrueFalseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwitchTrueFalseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchTrueFalseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
