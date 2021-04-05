import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'switch-true-false',
  templateUrl: './switch-true-false.component.html',
  styleUrls: ['./switch-true-false.component.css']
})
export class SwitchTrueFalseComponent implements OnInit {

  constructor() { }

  @Input() firstValue: any = '';
  currentValue: any = '';
  @Output() value = new EventEmitter<any>();

  setValue(value) {
    this.currentValue = value;
    console.log('switch-true-false: set current value', this.currentValue)
    this.value.emit(value);
  }

  ngOnInit(): void {
    if (this.firstValue === false || this.firstValue === true) this.currentValue = this.firstValue;
    else this.currentValue = '';
  }

}
