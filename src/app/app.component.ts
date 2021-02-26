import { Component, NgZone, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { ElectronService } from 'ngx-electron';
//import { LastDirectoryService } from './last-directory.service'
import { DbServiceService } from './db-service.service'
import { UpdateRecentService } from './update-recent.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  /* ------------------------------------- Импорт, драйверы ------------------------------------------ */
  
  constructor(
    private _electronService: ElectronService,
    //private _lastDirectoryService: LastDirectoryService,
    private _updateRecentService: UpdateRecentService,
    private conn: DbServiceService,
    private readonly _nz: NgZone
  ) { }
  private fs = this._electronService.remote.require('fs');
  private path = this._electronService.remote.require('path');
  private separator = this.path.sep;
  private recentPath = this.path.join(__dirname, "assets", "recent.txt");

  /* ------------------------------------- Приватные методы ------------------------------------------ */

  private readRecentProjects = function() {
    let fileContent = ''
    let listOfExistingDatabases = []
    try {
        fileContent = this.fs.readFileSync(this.recentPath, "utf8");
    } catch (err) {
        console.log(err)
        this.fs.writeFile(this.recentPath, "", function(error) {
            if (error) console.log(error);
            else console.log("Асинхронная запись пустого файла recent.txt завершена.");
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
    this._updateRecentService.recentPathArray = listOfExistingDatabases;
    this._updateRecentService.recentPath = this.recentPath;
    return listOfExistingDatabases;
  }

  /* -------------------------------------- Публичные параметры компонента, инициализация ----------------------------------------- */

  title = 'Graphytica';
  appView = 'start_view';
  newProjectParentDirectory = '';
  openProjectPath = '';
  @ViewChild('openGraphTypeTag') openGraphTypeTag;
  recentPathArray = this.readRecentProjects();
  @ViewChild('waitingMessageTag') waitingMessageTag;
  @ViewChild('waitingVoileTag') waitingVoileTag;
  ready = false;
  waiting = false;

  setWaiting(message) {
    if (message) {
      this.waitingVoileTag.nativeElement.className = 'loading_voile_full_screen';
      this.waitingMessageTag.nativeElement.innerText = message;
    } else {
      this.waitingVoileTag.nativeElement.className = 'loading_voile_hidden';
      this.waitingMessageTag.nativeElement.innerText = '';
    }
    this.waiting = !!message;
    console.log(message);
  }

  ngAfterViewInit(){
    var ipcRenderer = this._electronService.ipcRenderer;
    ipcRenderer.on('port-listening', (event,portListening) => {
      this._nz.run(() => {
        this.conn.port = portListening;
        this.setWaiting('');
        ipcRenderer.send('port-listening', true);
        this.ready = true;
      })
    });
    //отвечаем на запросы выхода, только если main_view не построен
    //console.log('Adding ipcRenderer listeners on app component')
    ipcRenderer.on('has-unsaved-changes', (event,request) => {
      //console.log('renderer app component received h-u-s')
      if (this.appView != 'main_view') {
        //console.log('renderer app component sends h-u-s')
        ipcRenderer.send('has-unsaved-changes', this.ready ? false : 'not_ready');
      }
    });
    ipcRenderer.on('quit-request', (event,request) => {
      //console.log('renderer app component received q-r')
      if (this.appView != 'main_view') {
        //console.log('renderer app component sends q-r')
        ipcRenderer.send('quit-request', true);
      }
    });
    let importExportSuccessListener = (event,jsonstr) => {
      if (this.appView != 'main_view') {
        this.setWaiting('Почти готово...');
        console.log('renderer app component received import or export success =', jsonstr);
        if (!jsonstr) {
          this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
            type: 'warning',
            buttons: ['OK'],
            title: 'Ошибка',
            message: 'Произошла ошибка. Попробуйте еще раз.'
          });
          console.log('event.ports:', event.ports);
          this.setWaiting('');
          return;
        }
        let obj = JSON.parse(jsonstr);

        this._nz.run(() => {
          this.newProjectParentDirectory = '';
          this.openProjectPath = '';
          this._updateRecentService.updateRecentProjects(obj.src);

          let extIndex = obj.src.lastIndexOf('.export.gz');
          if (extIndex < 0) extIndex = obj.src.length;
          let dbName = obj.src.substring(obj.src.lastIndexOf(this.separator)+1, extIndex);

          this.getParams = () => {
            return {
              dbName: dbName,
              dbLastSavedPath: obj.src,
              dbOpenedWithFormat: obj.format
            }
          }
          this.switchAppView('main_view');
          this.setWaiting('');
        });
      }
    };
    ipcRenderer.on('import-success', importExportSuccessListener)
    ipcRenderer.on('export-success', importExportSuccessListener);
  }

  /* -------------------------------------- Коллбеки и слушатели ------------------------------------------ */

  switchAppView = (value) => {
    if (this.appView == 'main_view') {
      this._electronService.ipcRenderer.send('fixed-size', '');
      this._electronService.remote.getCurrentWindow().setTitle('Graphytica');
      console.log('....ffff')
    } if (this.appView != value) {
      if (value == 'main_view') {
        this._electronService.ipcRenderer.send('full-size', '');
      }
      this.appView = value;
    }
  }

  getParams = () => {};

  newProjectPathUpdateCallback = (paths) => {
    this.newProjectParentDirectory = paths[0];
    console.log(`newProjectPathUpdateCallback: selectedPath = ${this.newProjectParentDirectory}`)
  }

  projectFolderExists = (prName) => {
    if (!prName) return false;
    //console.log(this.newProjectParentDirectory, prName);
    return this.fs.existsSync(this.path.join(this.newProjectParentDirectory, prName+'.export.gz'));
  }

  isValidFilename(p) {
    //console.log('isValidFile:', p)
    if (!p) return true;
		switch (process.platform) { 
			//case 'darwin': - не знаю насчет того буду ли я собирать под мак
			case 'win32': {
        //console.log('check space or dot at end')
        if (p.endsWith(' ') || p.endsWith('\t') || p.endsWith('\n') || p.endsWith('\r') || p.endsWith('.')) return false;

        //console.log('check forbidden keyword')
        let windowsForbidden = ["CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
        for (let i = 0; i<windowsForbidden.length; i++) {
          let forb = windowsForbidden[i];
          if (p.toLowerCase() === forb.toLowerCase()) return false;
          let forbidWithExtensionRegexp = new RegExp(`^(${forb})\\..*$`, 'i');// example: CON.txt is forbidden
          let isForbWithExt = forbidWithExtensionRegexp.test(p);
          if (isForbWithExt) return false;
        }

        //console.log('check bad symbols')
        let good = /^[^"\\\/\?><\|:\*\000-\031]+$/.test(p);// exclude forbidden chars
        //console.log('is good:', good)
        return good;
      }
      default: {
        let regexp = /^[^\/\000-\031]+$/.test(p);
        return regexp;
      }
    }
  }

  createProject = (form) => {
    this.setWaiting('Создание родительского каталога...');
    let prName = form.value.new_project_name;
    let prExportPath = this.path.join(this.newProjectParentDirectory, prName)+'.export';

    this.fs.mkdir(this.newProjectParentDirectory, {recursive: true}, (err) => { 
      if (err) { 
        return console.error(err); 
      } else {
        console.log('Directory created successfully!');
        let connect = this.conn.getConnectionPromise(this.setWaiting.bind(this));
        connect.then(() => {
          // первый экспорт пустой базы данных
          this.setWaiting('Сохранение проекта...');
          this._electronService.ipcRenderer.send('export-database', prExportPath);
        });
      }
    });
  }

  openProjectPathUpdateCallback = (paths) => {
    this.openProjectPath = paths[0];
    //console.log(`newProjectPathUpdateCallback: selectedPath = ${this.newProjectParentDirectory}`)
  }

  openProjectExists = () => {
    return this.fs.existsSync(this.openProjectPath) && this.fs.lstatSync(this.openProjectPath).isFile();
  }

  openProject = (format) => {
    let connect = this.conn.getConnectionPromise(this.setWaiting.bind(this));
    connect.then(() => {
      this.setWaiting('Открытие проекта...');
      let params = {
        src: this.openProjectPath,
        format: format,
        merge: false
      }
      this._electronService.ipcRenderer.send('import-database', JSON.stringify(params));
      console.log('openProject(): sent import-database request')
    });
  }

  reopenProject = (projectPath, format) => {
    //this.switchAppView('start_view');
    this.openProjectPath = projectPath;
    this.openProject(format);
  }

  quitClickListener() {
    this._electronService.remote.getCurrentWindow().close();
  }
}
