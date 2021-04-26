import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-sq-selector',
  templateUrl: './sq-selector.component.html',
  styleUrls: ['./sq-selector.component.css']
})
export class SqSelectorComponent implements OnInit {

  constructor() { }

  @Input() tree: any = {};

  ngOnInit(): void {
  }

}
