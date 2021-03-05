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
  private path = this._electronService.remote.require('path');

  recentPathArray = [];
  recentPath = this.path.join(__dirname, "assets", "recent.txt");;
  maxRecords = 10;

  readRecentProjects = function() {
    let fileContent = ''
    let listOfExistingDatabases = []
    try {
        fileContent = this.fs.readFileSync(this.recentPath, "utf8");
    } catch (err) {
        console.log(err)
        this.fs.writeFile(this.recentPath, "", function(error) {
            if (error) console.log(error);
            //else console.log("Асинхронная запись пустого файла recent.txt завершена.");
        });
    }
    if (fileContent) {
        let listOfProjects = fileContent.split('\n')
        let n = Math.min(listOfProjects.length, 5)
        for (let i = 0; i<n; i++) {
            let projectPath = listOfProjects[i]
            if (projectPath) {
                if (!this.fs.existsSync(projectPath)) {
                    console.log(projectPath + ' does not exist. Removing from list')
                    continue
                }
                let index = listOfExistingDatabases.indexOf(projectPath)
                if (index >= 0) listOfExistingDatabases.splice(index, 1)
                listOfExistingDatabases.push(projectPath)
            }
        }
    }
    this.recentPathArray = listOfExistingDatabases;
  }

  updateRecentProjects = function(path) {
    let index = this.recentPathArray.indexOf(path)
    if (index >= 0) {
      this.recentPathArray.splice(index, 1);
    } else if (index < 0 && this.recentPathArray.length >= this.maxRecords) {
      //удалить элементы начиная с индекса maxRecent-1, в кол-ве length - maxRecent + 1
      this.recentPathArray.splice(this.maxRecords - 1, this.recentPathArray.length - this.maxRecords + 1);
    }
    this.recentPathArray.unshift(path);
    this.fs.writeFile(this.recentPath, this.recentPathArray.join('\n') + '\n', function(error) {
      if (error) console.log(error);
      //else console.log('Асинхронная запись файла recent.txt завершена.');
    });
  }

  removeFromList = function(path) {//, callback
    let index = this.recentPathArray.indexOf(path)
    if (index >= 0) {
      this.recentPathArray.splice(index, 1);
    }
    this.fs.writeFile(this.recentPath, this.recentPathArray.join('\n') + '\n', function(error) {
      if (error) console.log(error);
      //else console.log('Асинхронная запись файла recent.txt завершена.');
      //if (callback && typeof callback == 'function') callback();
    });
  }
}
