import {Component, NgZone, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {take} from 'rxjs/operators';

@Component({
  selector: 'autosized-textarea',
  templateUrl: './autosized-textarea.component.html',
  styleUrls: ['./autosized-textarea.component.css']
})
export class AutosizedTextareaComponent {
  constructor(private _ngZone: NgZone) {}

  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() title: string = '';
  @Input() autofocus: boolean = false;
  @Input() isMasked: boolean = true;
}