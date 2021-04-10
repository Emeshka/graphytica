import { Component, OnInit, Input, Output, EventEmitter, ViewChild, SimpleChanges } from '@angular/core';

@Component({
  selector: 'date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnInit {

  constructor() { }

  @Input() firstValue: any = '';
  @Input() title: any = '';
  @Input() isMasked: boolean = true;
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

  onInput(part, element) {
    let invalid = element.value < element.dataset.min*1 || element.value > element.dataset.max*1
            || Math.floor(element.value*1) != element.value*1;
    //console.log('input invalid =', invalid)
    let next = (''+element.value).length >= (''+element.dataset.max).length
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
    //console.log(event.code, event.target.value)
    if (event.code == 'ArrowLeft' && event.target.selectionStart == 0) {
      event.target.value == ''
      if (part == 'month') {
        this.onChange()
        this.dayField.nativeElement.focus();
      } else if (part == 'year') {
        this.onChange()
        this.monthField.nativeElement.focus();
      }
      event.preventDefault();
    }
    if (event.code == 'ArrowRight' && event.target.selectionStart == event.target.value.length) {
      if (part == 'day') {
        this.onChange()
        this.monthField.nativeElement.focus();
        this.monthField.nativeElement.selectionStart = 0;
        this.monthField.nativeElement.selectionEnd = 0;
      } else if (part == 'month') {
        this.onChange()
        this.yearField.nativeElement.focus();
        this.yearField.nativeElement.selectionStart = 0;
        this.yearField.nativeElement.selectionEnd = 0;
      }
      event.preventDefault();
    }

    let canIncrease = true
    let canDecrease = true
    if (part == 'day') {
      canIncrease = (this.day == null || this.day < this.daysInMonth())
      canDecrease = this.day > 1
    } else if (part == 'month') {
      canIncrease = (this.month == null || this.month < 11)
      canDecrease = this.month > 0
    } else if (part == 'year') {
      canIncrease = (this.year == null || this.year < 2200)
      canDecrease = this.year > 1901
    }

    //console.log('keyDown canIncrease', canIncrease, 'canDecrease', canDecrease)
    //console.log('keyDown', this.day, this.month, this.year)
    if (event.code == 'ArrowUp' && canIncrease) {
      this.onInputClick(null, part, 'increase')
    } else if (event.code == 'ArrowDown' && canDecrease) {
      this.onInputClick(null, part, 'decrease')
    }
  }

  onInputClick(event, part, mode) {
    //console.log('onInputClick', part, mode)
    if (event) event.preventDefault();
    let field = null
    let previous = null
    if (part == 'day') {
      field = this.dayField.nativeElement
      previous = this.day ? this.day : 0
      field.value = (mode == 'increase') ? previous + 1 : previous - 1
    } else if (part == 'month') {
      field = this.monthField.nativeElement
      previous = this.month ? this.month : 0
      field.value = (mode == 'increase') ? previous + 2 : previous
    } else if (part == 'year') {
      field = this.yearField.nativeElement
      previous = this.year ? this.year : 1900
      field.value = (mode == 'increase') ? previous + 1 : previous - 1
    }
    //console.log('onInputClick calling onInput', field)
    this.onInput(part, field)
    field.focus();
  }

  emitValue(value) {
    //console.log('date-picker emit', value)
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
    //console.log('emit', this.day, this.month, this.year)
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
    //console.log('change', this.day, this.month, this.year)
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

  setValueFromFirst(value) {
    this.firstValue = new Date(value);
    this.currentValue = this.firstValue;
    //console.log(this.firstValue)
    this.day = this.firstValue.getDate();
    this.month = this.firstValue.getMonth();
    this.year = this.firstValue.getFullYear();
  }
        
  ngOnChanges(changes: SimpleChanges) {
    if (changes.firstValue && this.dayField && this.monthField && this.yearField) {
      //console.log('date-picker ngOnChanges firstValue', changes.firstValue.currentValue)
      if (changes.firstValue.currentValue) {
        this.setValueFromFirst(changes.firstValue.currentValue)
      } else {
        this.day = null;
        this.month = null;
        this.year = null;
      }
      this.onChange()
    }
  }

  ngOnInit(): void {
    if (this.firstValue) {
      this.setValueFromFirst(this.firstValue)
    }
  }

  ngAfterViewInit(): void {
    if (this.firstValue) {
      this.onChange()
    }
  }
}
