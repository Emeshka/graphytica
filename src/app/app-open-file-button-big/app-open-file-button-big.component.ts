import { Component, OnInit, Input } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { LastDirectoryService } from '../last-directory.service';

@Component({
  selector: 'app-save-file-tile-button',
  styleUrls: ['./app-open-file-button-big.component.css', '../tile-button-styles.css'],
  templateUrl: './app-open-file-button-big.component.html'
})
export class AppOpenFileButtonBigComponent implements OnInit {

  constructor(
    private _electronService: ElectronService,
    private _lastDirectoryService: LastDirectoryService
  ) { }

  ngOnInit(): void {
  }

  @Input() text: string;
  @Input() iconSrc: string;
  @Input() callback: (result) => {};

  private separator = this._electronService.remote.require('path').sep;

  openClickListener() {
    const remote = this._electronService.remote;
    //console.log('lastdir:', this._lastDirectoryService.value);
    remote.dialog
      .showSaveDialog(remote.getCurrentWindow(), {
        title: 'Сохранить как',
        defaultPath: this._lastDirectoryService.value || remote.app.getPath('documents') || remote.app.getPath('home') || ".",
      })
      .then((result) => {
        if (!result || !result.filePath){
          console.log('You didn\'t select a file');
        } else {
          let path = result.filePath;
          this._lastDirectoryService.value = path.substring(0, path.lastIndexOf(this.separator));
          this.callback(result.filePath);
        }
      });
  }
}
