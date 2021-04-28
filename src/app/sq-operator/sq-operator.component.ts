import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'sq-operator',
  templateUrl: './sq-operator.component.html',
  styleUrls: ['./sq-operator.component.css']
})
export class SqOperatorComponent implements OnInit {

  constructor() { }

  @Input() tree: any = {};
  single = false;
  isFirstSelector = false;
  isSecondSelector = false;

  ngOnInit(): void {
    this.single = this.tree.args.length == 1
    this.isFirstSelector = this.tree.args[0].type == 'selector'
    if (this.single) this.isSecondSelector = this.tree.args[1].type == 'selector'
  }
}
