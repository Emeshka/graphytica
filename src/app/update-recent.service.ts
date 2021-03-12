import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateRecentService {

  constructor(
    private _electronService: ElectronService
  ) {
    this.readRecentProjects()
  }
  private fs = this._electronService.remote.require('fs');
  private path = this._electronService.remote.require('path');

  recentPathArray = [];
  recentPath = this.path.join(__dirname, "assets", "recent.txt");
  maxRecords = 10;
  change: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readRecentProjects = function() {
    let fileContent = ''
    let listOfExistingDatabases = []
    try {
        fileContent = this.fs.readFileSync(this.recentPath, "utf8");
    } catch (err) {
        console.log(err)
        this.fs.writeFile(this.recentPath, "", function(error) {
            if (error) console.log(error);
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
    this.change.next(true);
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
    this.change.next(true);
    this.fs.writeFile(this.recentPath, this.recentPathArray.join('\n') + '\n', function(error) {
      if (error) console.log(error);
    });
  }

  removeFromList = function(path) {
    let index = this.recentPathArray.indexOf(path)
    if (index >= 0) {
      this.recentPathArray.splice(index, 1);
      this.change.next(true);
      this.fs.writeFile(this.recentPath, this.recentPathArray.join('\n') + '\n', function(error) {
        if (error) console.log(error);
      });
    }
  }
}
