import { Component, OnInit, Input } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { LastDirectoryService } from '../last-directory.service';

@Component({
  selector: 'app-filepath-selector',
  templateUrl: './filepath-selector.component.html',
  styleUrls: ['./filepath-selector.component.css']
})
export class FilepathSelectorComponent implements OnInit {

  constructor(
    private _electronService: ElectronService,
    private _lastDirectoryService: LastDirectoryService) {}

  ngOnInit(): void {
  }

  @Input() callback: (result) => {};
  @Input() selectFolders: boolean;
  @Input() multiselection: boolean;

  paths = [];
  notValidatingPaths = [];
  errorMessage = '';

  private separator = this._electronService.remote.require('path').sep;

  openClickListener() {
    const remote = this._electronService.remote;
    //console.log('lastdir:', this._lastDirectoryService.value);
    let options = [];
    options.push(this.selectFolders ? 'openDirectory' : 'openFile');
    if (this.multiselection) options.push('multiSelections');
    remote.dialog
      .showOpenDialog(remote.getCurrentWindow(), {
        title: 'Выберите '+(this.selectFolders ? (this.multiselection ? 'папки' : 'папку') : (this.multiselection ? 'файлы' : 'файл')),
        properties: options,
        defaultPath: this._lastDirectoryService.value || remote.app.getPath('documents') || remote.app.getPath('home') || ".",
      })
      .then((result) => {
        if (result && result.filePaths && result.filePaths[0]) {
          console.log('result.filePaths:', result.filePaths)
          let path = result.filePaths[0];
          this._lastDirectoryService.value = path.substring(0, path.lastIndexOf(this.separator));
          this.callback(result.filePaths);
          this.paths = result.filePaths;
          this.errorMessage = '';
          this.notValidatingPaths = result.filePaths;
        }
      });
  }

  inputValue() {
    if (this.multiselection) return this.notValidatingPaths.map((e) => '"'+e+'"').join(', ');
    else if (this.notValidatingPaths[0]) return this.notValidatingPaths[0];
    else return '';
  }

  private isValidFSPath(p) {
    if (!p) return true;
    let regexp;
		switch (process.platform) { 
			//case 'darwin': - не знаю насчет того буду ли я собирать под мак
			case 'win32': regexp = /^[A-Z]\:[^"\?><\|:\*\000-\031]*$/; break;
			default: regexp = /^\/[^\000]*$/; break;
    }
    return regexp.test(p);
  }

  private isASCII(p) {
    if (!p) return true;
    let regexp;
		switch (process.platform) { 
			//case 'darwin': - не знаю насчет того буду ли я собирать под мак
			case 'win32': regexp = /^[A-Z]\:[^"\?><\|:\*\000-\031]*$/; break;
			default: regexp = /^\/[^\000]*$/; break;
    }
    return regexp.test(p);
  }

  updatePaths(value) {
    //https://stackoverflow.com/questions/18893390/splitting-on-comma-outside-quotes
    let p = value.split(',(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)');
    //console.log(`updatePaths: splitted = ${p}, instanceof Array: ${p instanceof Array}`, p);
    //if (!(p instanceof Array)) p = [p];
    //если надо выбрать один файл, то кавычки необязательны, и из this.paths их удаляем если они есть
    //if (!this.multiselection && p[0].startsWith('"') && p[0].endsWith('"')) p[0] = p[0].substring(1, p[0].length-1);
    for (let i = 0; i<p.length; i++) {
      //let pathNoQuotes = p[i];
      //console.log('updatePaths:', p[i])
      //if (p[i].startsWith('"') && p[i].endsWith('"')) p[i] = p[i].substring(1, p[i].length-1);
      if (!this.isValidFSPath(p[i])) {
        this.errorMessage = 'Путь ' + p[i] + ' недопустим в вашей операционной системе.';
        this.callback(['']);
        this.paths = [];
        return;
      } else if (!this.isValidFSPath(p[i])) {
        this.errorMessage = 'Путь к файлу должен.';
        this.callback(['']);
        this.paths = [];
        return;
      } else this.errorMessage = '';
    }
    this.callback(p);
    this.paths = p;
    this.notValidatingPaths = p;
    //console.log(`updatePaths: this.paths = ${this.paths}`)
  }
}
