import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'switch-true-false',
  templateUrl: './switch-true-false.component.html',
  styleUrls: ['./switch-true-false.component.css']
})
export class SwitchTrueFalseComponent implements OnInit {

  constructor() { }

  @Input() currentValue: any = '';
  @Output() value = new EventEmitter<any>();

  setValue(value) {
    console.log('switch-true-false emit', value)
    this.currentValue = value;
    this.value.emit(value);
  }

  ngOnInit(): void {
  }

}
