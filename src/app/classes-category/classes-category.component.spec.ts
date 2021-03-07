import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesCategoryComponent } from './classes-category.component';

describe('ClassesCategoryComponent', () => {
  let component: ClassesCategoryComponent;
  let fixture: ComponentFixture<ClassesCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassesCategoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassesCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
