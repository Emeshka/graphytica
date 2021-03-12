import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DbServiceService } from '../db-service.service';

@Component({
  selector: 'edit-category',
  templateUrl: './vertices-category.component.html',
  styleUrls: ['./vertices-category.component.css']
})
export class VerticesCategoryComponent implements OnInit {

  constructor(
    private conn: DbServiceService
  ) { }

  @Input() selection: any;
  @Input() setTool: (toolId) => {};
  @Input() isActiveTool;
  @Input() toolById;
  @Input() activeToolId: string;
  //@Output() activeToolIdChange = new EventEmitter<string>();

  //setToolEmit()

  toolList = ['new_vertex']
  ngOnInit(): void {
  }
}
