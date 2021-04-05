import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'tiny-button',
  templateUrl: './tiny-button.component.html',
  styleUrls: ['./tiny-button.component.css']
})
export class TinyButtonComponent {

  constructor() { }

  @Input() title: string;
  @Input() iconSrc: string;
  @Input() callback: () => {};
  @Input() disabled: boolean;

  onclick() {
    if (typeof this.callback == 'function' && !this.disabled) this.callback();
  }
}
