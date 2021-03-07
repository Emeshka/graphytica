import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeBranchComponent } from './tree-branch.component';

describe('TreeBranchComponent', () => {
  let component: TreeBranchComponent;
  let fixture: ComponentFixture<TreeBranchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TreeBranchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeBranchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
