import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-pretty-button',
  templateUrl: './pretty-button.component.html',
  styleUrls: ['./pretty-button.component.css']
})
export class PrettyButtonComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input() text: string;
  @Input() active: any = true;
  @Input() type: any = "button";
  @Input() callback: () => {};
  get isActive() {
    if (typeof this.active == 'function') return this.active();
    else return !!this.active;
  }

  onclick() {
    if (typeof this.callback == 'function' && this.isActive) this.callback();
  }
}
