import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class UpdateRecentService {

  constructor(
    private _electronService: ElectronService
  ) { }
  private fs = this._electronService.remote.require('fs');

  recentPathArray = [];
  recentPath = '';

  updateRecentProjects = function(path) {
    let index = this.recentPathArray.indexOf(path)
    if (index > 0) {
      this.recentPathArray.splice(index, 1);
    } else if (index < 0 && this.recentPathArray.length >= 5) {
      //удалить элементы начиная с индекса maxRecent-1, в кол-ве length - maxRecent + 1
      this.recentPathArray.splice(5 - 1, this.recentPathArray.length - 5 + 1);
    }
    this.recentPathArray.unshift(path);
    this.fs.writeFile(this.recentPath, this.recentPathArray.join('\n') + '\n', function(error) {
      if (error) console.log(error);
      else console.log('Асинхронная запись файла recent.txt завершена.');
    });
  }
}
