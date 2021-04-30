import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css']
})
export class ActionButtonComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input() text: string;
  @Input() active: any = true;
  @Input() type: any = "button";
  @Input() callback: () => {};
  @Input() iconSrc: string;

  get isActive() {
    if (typeof this.active == 'function') return this.active();
    else return !!this.active;
  }

  onclick() {
    if (typeof this.callback == 'function' && this.isActive) this.callback();
  }
}
