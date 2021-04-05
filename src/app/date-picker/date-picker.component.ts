import { TYPED_NULL_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnInit {

  constructor() { }

  @Input() firstValue: any = '';
  @Output() value = new EventEmitter<any>();
  @ViewChild('day_field') dayField;
  @ViewChild('month_field') monthField;
  @ViewChild('year_field') yearField;

  currentValue = null;
  day = null;
  month = null;
  year = null;

  daysInMonth() {
    if (this.month !== null && this.year !== null) {
      return new Date(this.year, this.month+1, 0).getDate();
    } else {
      return 31
    }
  }

  onInput(part, event) {
    let element = event.target
    let invalid = element.value < element.min*1 || element.value > element.max*1
            || Math.floor(element.value*1) != element.value*1;
    console.log('input invalid =', invalid)
    let next = (''+element.value).length >= (''+element.max).length
    if (part == 'day') {
      if (!invalid) {/*element.value = this.day ? this.day : '';*/
        this.day = element.value*1;
        if (next) {
        }
      }
    } else if (part == 'month') {
      if (!invalid) {/*element.value = this.month != null ? this.month + 1 : '';*/
        this.month = element.value*1 - 1;
        if (next) {
        }
      }
    } else if (part == 'year') {
      if (!invalid) {/*element.value = this.year ? this.year : '';*/
        this.year = element.value*1;
      }
    }

    if (this.day !== null && this.month !== null && this.year !== null) {
      this.currentValue = new Date(this.year, this.month, this.day)
      this.emitValue(this.currentValue)
    }
    if (next) {
      if (part == 'day') {
        this.monthField.nativeElement.focus();
      } else if (part == 'month') {
        this.yearField.nativeElement.focus();
      }
    }
  }

  onKeyDown(part, event) {
    console.log(event.code, event.target.value)
    if (event.code == 'ArrowLeft' && event.target.value == '') {
      if (part == 'month') {
        this.onChange()
        this.dayField.nativeElement.focus();
      } else if (part == 'year') {
        this.onChange()
        this.monthField.nativeElement.focus();
      }
      event.preventDefault();
    }
    if (event.code == 'ArrowRight' && event.target.value == '') {
      if (part == 'day') {
        this.onChange()
        this.monthField.nativeElement.focus();
      } else if (part == 'month') {
        this.onChange()
        this.yearField.nativeElement.focus();
      }
      event.preventDefault();
    }
  }

  emitValue(value) {
    console.log('date-picker emit', value)
    this.currentValue = value
    if (value) {
      this.day = this.currentValue.getDate();
      this.month = this.currentValue.getMonth();
      this.year = this.currentValue.getFullYear();
    } else {
      this.day = null;
      this.month = null;
      this.year = null;
      this.onChange()
    }
    console.log('emit', this.day, this.month, this.year)
    this.value.emit(value);
  }

  onChange() {
    /*if (part == 'day') {
      this.dayField.nativeElement.value = this.day;
    } else if (part == 'month') {
      this.monthField.nativeElement.value = this.month;
    } else if (part == 'year') {
      this.yearField.nativeElement.value = this.year;
    } else if (part == 'all') {
    }*/
    console.log('change', this.day, this.month, this.year)
    /*if (this.day !== null && this.month !== null && this.year !== null) {
      this.dayField.nativeElement.value = this.currentValue.getDate();
      this.monthField.nativeElement.value = this.currentValue.getMonth() + 1;
      this.yearField.nativeElement.value = this.currentValue.getFullYear();
    } else {*/
    //}
    this.dayField.nativeElement.value = this.day ? this.day : '';
    this.monthField.nativeElement.value = this.month != null ? this.month + 1 : '';
    this.yearField.nativeElement.value = this.year ? this.year : '';
  }

  ngOnInit(): void {
    if (this.firstValue) {
      this.firstValue = new Date(this.firstValue);
      this.currentValue = this.firstValue;
      console.log(this.firstValue)
      this.day = this.firstValue.getDate();
      this.month = this.firstValue.getMonth();
      this.year = this.firstValue.getFullYear();
    }
  }

  ngAfterViewInit(): void {
    if (this.firstValue) {
      this.onChange()
    }
  }
}
