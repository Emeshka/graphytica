import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'selection-category',
  templateUrl: './selection-category.component.html',
  styleUrls: ['./selection-category.component.css']
})
export class SelectionCategoryComponent implements OnInit {

  constructor() { }
  @Input() selection;

  ngOnInit(): void {
  }
}
