import { Component, OnInit, Output, EventEmitter, Input, SimpleChanges } from '@angular/core';

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
  @Input() title: any = '';

  setValue(value) {
    this.currentValue = value;
    //console.log('switch-true-false: set current value', this.currentValue)
    this.value.emit(value);
  }
        
  ngOnChanges(changes: SimpleChanges) {
    if (changes.firstValue) {
      //console.log('switch-true-false ngOnChanges firstValue', changes.firstValue.currentValue)
      if (changes.firstValue.currentValue === false || changes.firstValue.currentValue === true) {
        this.currentValue = changes.firstValue.currentValue;
      } else this.currentValue = '';
    }
  }

  ngOnInit(): void {
    //console.log('switch-true-false', this.firstValue)
    if (this.firstValue === false || this.firstValue === true) this.currentValue = this.firstValue;
    else this.currentValue = '';
  }

}
