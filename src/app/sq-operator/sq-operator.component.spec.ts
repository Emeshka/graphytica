import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqOperatorComponent } from './sq-operator.component';

describe('SqOperatorComponent', () => {
  let component: SqOperatorComponent;
  let fixture: ComponentFixture<SqOperatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqOperatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SqOperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
