import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqPredicateComponent } from './sq-predicate.component';

describe('SqPredicateComponent', () => {
  let component: SqPredicateComponent;
  let fixture: ComponentFixture<SqPredicateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqPredicateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SqPredicateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
