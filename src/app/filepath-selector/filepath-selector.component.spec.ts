import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilepathSelectorComponent } from './filepath-selector.component';

describe('FilepathSelectorComponent', () => {
  let component: FilepathSelectorComponent;
  let fixture: ComponentFixture<FilepathSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilepathSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilepathSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
