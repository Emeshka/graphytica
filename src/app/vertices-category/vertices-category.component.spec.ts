import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticesCategoryComponent } from './vertices-category.component';

describe('VerticesCategoryComponent', () => {
  let component: VerticesCategoryComponent;
  let fixture: ComponentFixture<VerticesCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerticesCategoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerticesCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
