import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.css']
})
export class IconButtonComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input() title: string;
  @Input() iconSrc: string;
  @Input() active: any = false;
  @Input() callback: () => {};
  get isActive() {
    if (typeof this.active == 'function') return this.active();
    else return !!this.active;
  }
}
