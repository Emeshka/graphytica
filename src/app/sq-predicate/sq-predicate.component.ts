import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'sq-predicate',
  templateUrl: './sq-predicate.component.html',
  styleUrls: ['./sq-predicate.component.css']
})
export class SqPredicateComponent implements OnInit {

  constructor() { }

  @Input() tree: any = {};
  block = false;
  isLogical = false;

  ngOnInit(): void {
    console.log(this.tree);
    if (this.tree.type == 'condition') {
      
      let firstCond = this.tree.args[0].type == 'condition'
      if (this.tree.args.length > 1) {
        let secondCond = this.tree.args[1].type == 'condition'
        this.block = (firstCond || secondCond)
      } else {
        this.block = firstCond
      }
      
      this.isLogical = ['OR', 'AND', 'NOT', 'XOR'].includes(this.tree.name)
    }
  }
}
