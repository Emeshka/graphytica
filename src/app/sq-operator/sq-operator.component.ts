import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-sq-operator',
  templateUrl: './sq-operator.component.html',
  styleUrls: ['./sq-operator.component.css']
})
export class SqOperatorComponent implements OnInit {

  constructor() { }

  @Input() tree: any = {};
  single = false;
  isFirstPredicate = false;
  isSecondPredicate = false;

  ngOnInit(): void {
    this.single = this.tree.args.length == 1
    this.isFirstPredicate = this.tree.args[0].type == 'selector'
    if (this.single) this.isSecondPredicate = this.tree.args[1].type == 'selector'
  }
}
