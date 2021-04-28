import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'sq-predicate',
  templateUrl: './sq-predicate.component.html',
  styleUrls: ['./sq-predicate.component.css']
})
export class SqPredicateComponent implements OnInit {

  constructor() { }

  @Input() tree: any = {};

  ngOnInit(): void {
    console.log(this.tree);
    
  }
}
