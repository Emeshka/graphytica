import { Component, Input, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/sql/sql';
import { SandboxFunction } from '../main-view/SandboxFunction';

@Component({
  selector: 'code-mirror',
  templateUrl: './code-mirror.component.html',
  styleUrls: ['./code-mirror.component.css']
})
export class CodeMirrorComponent implements OnInit {

  constructor() { }

  @Input() value = '';
  @Input() mode = 'full';
  @ViewChild('ngxCodeMirror') ngxCodeMirror;
  @ViewChild('root') root;
  @Output() input = new EventEmitter<any>();
  @Output() change = new EventEmitter<any>();

  options = {}

  checkValid() {
    if (this.mode == 'sql') return true;

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
        
  ngOnChanges(changes: SimpleChanges) {
    if (changes.mode && changes.mode.currentValue) {
      if (this.mode != changes.mode.currentValue) {
        let editor = this.ngxCodeMirror.codeMirror;
        if (changes.mode.currentValue == 'sql') {
          editor.setOption('theme', 'mdn-like')
        } else if (changes.mode.currentValue == 'full') {
          editor.setOption('theme', 'yonce')
        }
      }
      this.mode = changes.mode.currentValue
    }
  }

  ngOnInit(): void {
    if (this.mode == 'full') {
      this.options = {
        value: this.value || '',
        lineNumbers: true,
        theme: 'yonce',
        mode: 'javascript'
      }
    } else if (this.mode == 'sql') {
      this.options = {
        height: '100px',
        value: this.value || '',
        lineWrapping: true,
        mode: 'sql',
        theme: 'mdn-like'
      }
        //parserfile: '../../assets/sql_highlighting/parsesql.js',
        //stylesheet: '../../assets/sql_highlighting/sqlcolors.css',
        //path: '../../assets/sql_highlighting/js/'
        //
    }
  }

  ngAfterViewInit(){
  }
}
