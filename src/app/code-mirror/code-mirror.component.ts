import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import 'codemirror/mode/javascript/javascript';
import { SandboxFunction } from '../main-view/SandboxFunction';

@Component({
  selector: 'code-mirror',
  templateUrl: './code-mirror.component.html',
  styleUrls: ['./code-mirror.component.css']
})
export class CodeMirrorComponent implements OnInit {

  constructor() { }

  @Input() value = '';
  @ViewChild('ngxCodeMirror') ngxCodeMirror;
  @ViewChild('root') root;
  @Output() input = new EventEmitter<any>();
  @Output() change = new EventEmitter<any>();

  options = {}

  checkValid() {
    let error = SandboxFunction.tryCreate(this.value)
    
    if (error) {
      this.root.nativeElement.className = 'root invalid_input'

      let title = `${error.name}: ${error.message}`
      for (let p in error) {
        if (p != 'stack') {
          title += `\n${p}: ${error[p]}`
        }
      }
      this.root.nativeElement.title = title
      return false
    } else {
      this.root.nativeElement.className = 'root'
      this.root.nativeElement.title = ''
      return true
    }
  }

  onInput(event) {
    event.stopPropagation();
    if (this.checkValid()) {
      this.input.emit(this.value);
    }
    //let editor = this.ngxCodeMirror.codeMirror;
    //console.log(editor, this.value);
  }

  onChange(event) {
    event.stopPropagation();
    if (this.checkValid()) {
      this.change.emit(this.value);
    }
  }

  ngOnInit(): void {
    //console.log(this.value);
    this.options = {
      value: this.value || '',
      lineNumbers: true,
      //lineWrapping: true,
      theme: 'yonce',
      mode: 'javascript'
    }
  }

  ngAfterViewInit(){
  }
}
