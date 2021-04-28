import { Component, Input, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
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

  editor = null
  options = {}

  checkValid() {
    if (this.mode == 'sql') {
      return true;
    }

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
    if (this.mode == 'sql') {
      this.editor.showHint();
    }
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
        if (changes.mode.currentValue == 'sql') {
          this.editor.setOption('theme', 'default')
          //editor.setOption('theme', 'mdn-like')
        } else if (changes.mode.currentValue == 'full') {
          this.editor.setOption('theme', 'yonce')
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
        mode: 'javascript',
        matchBrackets: true
      }
    } else if (this.mode == 'sql') {
      let keywords = ['SELECT', 'XOR', 'OR', 'AND', 'NOT', 'WHERE', 'isSimple', 'isLoop', 'isHidden',
        'degree', 'indegree', 'outDegree', 'any', 'nodes', 'edges', '.unify(', '.intersect(', '.diff(',
        '.openNeighborhood', '.closedNeighborhood', '.edgesWith(', '.edgesTo(', '.connectedNodes', '.connectedEdges',
        '.sources', '.targets', '.outgoers', '.incomers', '.successors', '.predecessors'
      ]
      this.options = {
        value: this.value || '',
        lineWrapping: true,
        mode: 'sql',
        matchBrackets: true,
        autofocus: true,
        extraKeys: {'Ctrl-Space': 'autocomplete'},
        hintOptions: {
          completeSingle: false,
          completeOnSingleClick: false,
          hint: function(editor, options) {
            var cursor = editor.getCursor(), line = editor.getLine(cursor.line)
            var start = cursor.ch, end = cursor.ch
            while (start && /[\w\.]/.test(line.charAt(start - 1))) --start
            while (end < line.length && /[\w\.]/.test(line.charAt(end))) ++end

            var word = line.slice(start, end)//.toLowerCase()

            //console.log(`hint(): word = '${word}'`)
            if (word.length > 0) {
              let list = []
              for (let keyword of keywords) {
                //console.log(`hint(): keyword = '${keyword}', starts: ${keyword.startsWith(word)}`)
                if (keyword == keyword.toUpperCase()) {
                  if (keyword.toLowerCase().startsWith(word)) {
                    list.push(keyword)
                  }
                } else {
                  if (keyword.startsWith(word)) {
                    list.push(keyword)
                  }
                }
              }
              //console.log(`hint(): list = '${list.join(', ')}'`)
              if (list.length > 0) {
                return {
                  list: list,
                  from: {
                    ch: start,
                    line: cursor.line
                  },//editor.getCursor(),
                  to: {
                    ch: end,
                    line: cursor.line
                  }//editor.getCursor()
                }
              }
            }
            return null
            //from: CodeMirror.Pos(cursor.line, start),
            //to: CodeMirror.Pos(cursor.line, end)})
          }
        }
        //theme: 'mdn-like'
      }
        //parserfile: '../../assets/sql_highlighting/parsesql.js',
        //stylesheet: '../../assets/sql_highlighting/sqlcolors.css',
        //path: '../../assets/sql_highlighting/js/'
        //
    }
  }

  ngAfterViewInit(){
    this.editor = this.ngxCodeMirror.codeMirror;
  }
}
