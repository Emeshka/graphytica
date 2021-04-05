import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.css']
})
export class IconButtonComponent {

  constructor() { }

  @Input() title: string;
  @Input() iconSrc: string;
  @Input() active: any = false;
  @Input() callback: () => {};

  afterViewInit = false

  isActive() {
    if (typeof this.active == 'function') return this.active();
    else return !!this.active;
  }
}
