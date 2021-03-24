import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {Component, NgZone, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {take} from 'rxjs/operators';

@Component({
  selector: 'autosized-textarea',
  templateUrl: './autosized-textarea.component.html',
  styleUrls: ['./autosized-textarea.component.css']
})
export class AutosizedTextareaComponent {
  constructor(private _ngZone: NgZone) {}

  //@ViewChild('autosize') autosize: CdkTextareaAutosize;

  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() autofocus: boolean = false;
  @Input() isMasked: boolean = true;
  //@Output() input = new EventEmitter<Event>();
  //@Output() change = new EventEmitter<Event>();

  /*triggerResize() {
    // Wait for changes to be applied, then trigger textarea resize.
    this._ngZone.onStable.pipe(take(1))
        .subscribe(() => this.autosize.resizeToFitContent(true));
  }

  inputListener(event) {
    event.resizeToFitContent = () => {
      console.log('resizeToFitContent()')
      this.autosize.resizeToFitContent(true)
    }
    console.log('autosized-textarea input emit', event)
    this.input.emit(event);
  }

  changeListener(event) {
    event.resizeToFitContent = () => {
      this.autosize.resizeToFitContent(true)
    }
    console.log('autosized-textarea change emit', event)
    this.change.emit(event);
  }*/
}