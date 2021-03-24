import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutosizedTextareaComponent } from './autosized-textarea.component';

describe('AutosizedTextareaComponent', () => {
  let component: AutosizedTextareaComponent;
  let fixture: ComponentFixture<AutosizedTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutosizedTextareaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutosizedTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
