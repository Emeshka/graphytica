import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqSelectorComponent } from './sq-selector.component';

describe('SqSelectorComponent', () => {
  let component: SqSelectorComponent;
  let fixture: ComponentFixture<SqSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SqSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
