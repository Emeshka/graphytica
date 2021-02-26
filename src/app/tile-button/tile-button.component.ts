import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-button',
  templateUrl: './tile-button.component.html',
  styleUrls: ['./tile-button.component.css', '../tile-button-styles.css']
})
export class TileButtonComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input() text: string = '';
  @Input() iconSrc: string = '';
  @Input() disabled : any = false;
  @Input() callback: () => {};

  get isDisabled() {
    if (typeof this.disabled == 'function') return this.disabled();
    else return !!this.disabled;
  }
  action = () => {
    if (!this.isDisabled) this.callback();
  }
}
