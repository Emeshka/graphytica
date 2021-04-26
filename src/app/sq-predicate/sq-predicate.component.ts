import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-sq-predicate',
  templateUrl: './sq-predicate.component.html',
  styleUrls: ['./sq-predicate.component.css']
})
export class SqPredicateComponent implements OnInit {

  constructor() { }

  @Input() tree: any = {};

  /*fakeField = false
  fakeType = 'class'

  switchFake() {
    this.fakeField = !this.fakeField
  }

  setFakeValue = */

  ngOnInit(): void {
  }
}
