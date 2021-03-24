import { Component, Input, ViewChild, NgZone } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { DbServiceService } from '../db-service.service';
import { UpdateRecentService } from '../update-recent.service';
import { OSelection } from './Selection';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import gridGuide from 'cytoscape-grid-guide';
cytoscape.use( cola );
gridGuide( cytoscape );

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css']
})

export class MainViewComponent {
  /* ---------------------------------------------------- private --------------------------------------------------- */
  constructor(
    private _electronService: ElectronService,
    private _updateRecentService: UpdateRecentService,
    private conn: DbServiceService,
    private _nz: NgZone) { }

  private fs = this._electronService.remote.require('fs');
  private path = this._electronService.remote.require('path');
  private ipcRenderer = this._electronService.ipcRenderer;
  private cy;

  private _dbLastSavedPath : string;
  public set dbLastSavedPath(val: any) {
    this._dbLastSavedPath = val;
    this.setWindowTitle();
  }
  public get dbLastSavedPath(): any {
    return this._dbLastSavedPath;
  }
  private _dbName : string;
  public set dbName(val: any) {
    this._dbName = val;
    this.setWindowTitle();
  }
  public get dbName(): any {
    return this._dbName;
  }
  private _unsavedChanges : boolean = false;
  public set unsavedChanges(val: any) {
    this._unsavedChanges = val;
    this.setWindowTitle();
  }
  public get unsavedChanges(): any {
    return this._unsavedChanges;
  }
  private setWindowTitle = () => {
    this._electronService.remote.getCurrentWindow()
      .setTitle(`Graphytica - ${this.dbName} [${this.unsavedChanges ? '*' : 'сохранено'}] (${this.dbLastSavedPath})`);
  }

  private hasUnsavedChangesListener = (event,request) => {
    this.ipcRenderer.send('has-unsaved-changes', this.unsavedChanges);
  };
  private quitRequestListener = (event,request) => {
    this.onClose(() => {
      this.ipcRenderer.send('quit-request', true);
    });
  };
   private successListener = (exportedPath) => {
    //console.log('main-view received export-success =', exportedPath);
    this._updateRecentService.updateRecentProjects(exportedPath);
    if (exportedPath) {
      this.unsavedChanges = false;
      this.dbLastSavedPath = exportedPath;

      let extIndex = exportedPath.lastIndexOf('.gph');
      if (extIndex < 0) {
        extIndex = exportedPath.length;
      }
      this.dbName = exportedPath.substring(exportedPath.lastIndexOf(this.path.sep)+1, extIndex);
      this.setWaiting('');
    }
  }
  
  /* ---------------------------------------------------- Input, ViewChild --------------------------------------------------- */

  @Input() getParams: any;
  @Input() backToStartView: () => {};
  @Input() setWaiting: (text) => {};
  @ViewChild('graph_field') graphField;

  /* ---------------------------------------------------- public --------------------------------------------------- */

  // диалоги и вуаль во время загрузки
  mainDialog : string = '';
  importPath : string = '';
  saveAsPath : string = '';
  
  public selection: OSelection = new OSelection([]);

  // инструменты, выделение
  openedCategory : string = 'file';
  isRendering : boolean = false;
  //graphClickListener = () => {};//активный инструмент: что делать по клику на cy
  zoomStep = 0.3;
  readonly toolById = {
    select_move_any: {
      icon: 'assets/img/select.png',
      title: 'Выделение и перемещение элементов',
      appliableTo: 'node, edge',//cytoscape selector
      oninit: () => {
        this.cy.autoungrabify(false);
        this.cy.autounselectify(false);
        this.cy.userPanningEnabled(false);
      }
    },
    pan_view: {
      icon: 'assets/img/grab.png',
      title: 'Перемещение поля зрения',
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
      }
    },
    zoom_in: {
      icon: 'assets/img/zoom_in.png',
      title: 'Увеличить масштаб',
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
      },
      onclick: (evt) => {
        this.cy.zoom({
          level: this.cy.zoom() + this.zoomStep,
          renderedPosition: evt.renderedPosition
        });
      }
    },
    zoom_out: {
      icon: 'assets/img/zoom_out.png',
      title: 'Уменьшить масштаб',
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
      },
      onclick: (evt) => {
        this.cy.zoom({
          level: this.cy.zoom() - this.zoomStep,
          renderedPosition: evt.renderedPosition
        });
      }
    },
    zoom_auto: {
      icon: 'assets/img/zoom_auto.png',
      title: 'Масштаб по умолчанию',
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
      },
      onclick: (evt) => {
        this.cy.zoom({
          level: 1,
          renderedPosition: evt.renderedPosition
        });
      }
    },
    new_vertex: {
      icon: 'assets/img/new_vertex.png',
      title: 'Создать вершину',
      settings: [
        {
          name: 'Класс новой вершины',
          type: 'select',
          options: [],
          optionsConstructor: () => {
            //console.log(this)
            return this.conn.getClassWithDescendants('V').map(c => {
              return {text: c.name, value: c.name}
            });
          },
          value: 'V'
        },
        {
          type: 'hidden',
          value: {}
        }
      ],
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
      },
      onclick: (evt) => {
        let cl = this.toolById.new_vertex.settings[0].value
        let data = {
          id: this.conn.nextId(),
          _class: cl
        };
        /*let props = this.conn.getClass(cl).properties
        for (let p in props) {
          data[p] = null
        }*/
        let propsOfNew: any = this.toolById.new_vertex.settings[1].value
        for (let p in propsOfNew) {
          data[p] = propsOfNew[p]
        }
        //console.log('new_vertex: class='+cl+', data:', data)
        this.cy.add([
          { group: 'nodes', data: data, position: evt.position }
        ]);
        this.unsavedChanges = true;
      }
    }
  };
  readonly controlsToolList = ['zoom_out', 'zoom_in', 'zoom_auto', 'select_move_any', 'pan_view'];
  activeToolId = '';

  /* ---------------------------------------------------- public functions --------------------------------------------------- */

  //сейчас можно только один слушатель события одновременно, неважно на какой селектор
  setTool = (toolId) => {
    //console.log(`setTool(): new = ${toolId}, old = ${this.activeToolId}`)
    if (this.activeToolId) {
      this.cy.removeListener('tap');
      this.cy.removeListener('tapdrag');
      this.cy.removeListener('mouseover');
      this.cy.removeListener('mouseout');
      this.cy.autoungrabify(true);
      this.cy.userPanningEnabled(true);
    }
    if (toolId || this.toolById[toolId]) this.activeToolId = toolId;
    else {
      console.log(`Warning: tried to set unknown tool '${toolId}'`);
      return;
    }

    let tool = this.toolById[toolId];
    let cursorPath = tool.icon.substring(0, tool.icon.length - 4) + '_cur_30x30.png';

    if (tool.oninit) tool.oninit();
    if (tool.appliableTo) {
      if (tool.onclick) this.cy.on('tap', tool.appliableTo, tool.onclick);
      if (tool.ondrag) this.cy.on('tapdrag', tool.appliableTo, tool.ondrag);
      //иконка инструмента
      this.cy.on('mouseover', tool.appliableTo, () => {
        this._nz.run(() => {
          //console.log(`tool mouseover`)
          this.graphField.nativeElement.style.cursor = `url('${cursorPath}'), pointer`;
        })
      });
      this.cy.on('mouseout', tool.appliableTo, () => {
        this._nz.run(() => {
          //console.log(`tool mouseout`)
          this.graphField.nativeElement.style.cursor = `default`;
        })
      });
    } else {
      if (tool.onclick) this.cy.on('tap', tool.onclick);
      if (tool.ondrag) this.cy.on('tapdrag', tool.ondrag);
      this.cy.on('mouseover', (evt) => {
        this._nz.run(() => {
          if (evt.target != this.cy) return;
          //console.log(`tool mouseover`)
          this.graphField.nativeElement.style.cursor = `url('${cursorPath}'), pointer`;
        })
      });
      this.cy.on('mouseout', (evt) => {
        this._nz.run(() => {
          if (evt.target != this.cy) return;
          //console.log(`tool mouseout`)
          this.graphField.nativeElement.style.cursor = `default`;
        })
      });
    }

    if (tool.settings) {
      for (let s of tool.settings) {
        if (s.optionsConstructor) s.options = s.optionsConstructor();
      }
    }
  }

  isActiveTool = (id) => {
    return this.activeToolId == id;
  }

  // полный ререндер. вызывать только в случае импорта, sql запроса или другого изменения графа не через cytoscape
  render = (data, zoom, pan) => {
    this.isRendering = true;
    //console.log(data);
    this.cy = cytoscape({
      container: this.graphField.nativeElement,
      elements: data,
      layout: {
        name: 'preset',
        fit: true
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#ffaa33',
            'label': 'data(id)'
          }
        }, {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#000000',
            'target-arrow-color': '#000000',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: ':selected',
          css: {
            'background-color': '#228c15',//'#ff6333',
            /*'border-width': '1px',
            'border-style': 'solid',
            'border-color': '#ddddff',*/
            'line-color': '#0000aa',
            'target-arrow-color': '#0000aa',
            'source-arrow-color': '#0000aa'
          }
        },
        {
          selector: '.cy_hidden',
          css: {
            'opacity': '0'
          }
        },
        {
          selector: '.cy_edit_hidden',
          css: {
            'opacity': '0.25'
          }
        }
      ],
      userZoomingEnabled: false,
      userPanningEnabled: true,
      autoungrabify: true,
      autounselectify: true
    });
    this.cy.gridGuide({
      // On/Off Modules
      /* From the following four snap options, at most one should be true at a given time */
      snapToGridOnRelease: false, // Snap to grid on release
      snapToGridDuringDrag: false, // Snap to grid during drag
      snapToAlignmentLocationOnRelease: false, // Snap to alignment location on release
      snapToAlignmentLocationDuringDrag: false, // Snap to alignment location during drag

      distributionGuidelines: false, // Distribution guidelines
      geometricGuideline: false, // Geometric guidelines
      initPosAlignment: false, // Guideline to initial mouse position
      centerToEdgeAlignment: false, // Center to edge alignment
      resize: false, // Adjust node sizes to cell sizes
      parentPadding: false, // Adjust parent sizes to cell sizes by padding
      drawGrid: true, // Draw grid background
  
      // General
      gridSpacing: 20, // Distance between the lines of the grid.
      snapToGridCenter: true, // Snaps nodes to center of gridlines. When false, snaps to gridlines themselves. Note that either snapToGridOnRelease or snapToGridDuringDrag must be true.
  
      // Draw Grid
      zoomDash: true, // Determines whether the size of the dashes should change when the drawing is zoomed in and out if grid is drawn.
      panGrid: true, // Determines whether the grid should move then the user moves the graph if grid is drawn.
      gridStackOrder: -1, // Namely z-index
      gridColor: '#dedede', // Color of grid lines
      lineWidth: 1.0, // Width of grid lines
  
      // Guidelines
      guidelinesStackOrder: 4, // z-index of guidelines
      guidelinesTolerance: 2.00, // Tolerance distance for rendered positions of nodes' interaction.
      guidelinesStyle: { // Set ctx properties of line. Properties are here:
          strokeStyle: "#8b7d6b", // color of geometric guidelines
          geometricGuidelineRange: 400, // range of geometric guidelines
          range: 100, // max range of distribution guidelines
          minDistRange: 10, // min range for distribution guidelines
          distGuidelineOffset: 10, // shift amount of distribution guidelines
          horizontalDistColor: "#ff0000", // color of horizontal distribution alignment
          verticalDistColor: "#00ff00", // color of vertical distribution alignment
          initPosAlignmentColor: "#0000ff", // color of alignment to initial mouse location
          lineDash: [0, 0], // line style of geometric guidelines
          horizontalDistLine: [0, 0], // line style of horizontal distribution guidelines
          verticalDistLine: [0, 0], // line style of vertical distribution guidelines
          initPosAlignmentLine: [0, 0], // line style of alignment to initial mouse position
      },
  
      // Parent Padding
      parentSpacing: -1 // -1 to set paddings of parents to gridSpacing
    })
    // cy.(un)select => Selection obj change
    let selectionUpdate = () => {
      this.selection.pushAll(this.cy.$(':selected'));
      console.log('this.selectionEdges: ', this.selection);
    }
    this.cy.on('select', selectionUpdate)
    this.cy.on('unselect', selectionUpdate)
    this.cy.on('remove', selectionUpdate)
    this.cy.viewport({
      zoom: zoom,
      pan: pan
    });

    let catchChanges = (event) => {
      //console.log(event)
      this.unsavedChanges = true
    }
    this.cy.on('add remove move select unselect tapselect tapunselect boxselect box lock', catchChanges)
    this.cy.elements().on('data', catchChanges)
    
    this.conn.cy = this.cy;
    //console.log(this.conn.cy.elements().jsons());
    this.isRendering = false;
    this.setTool('pan_view');
  }

  // переключатель категорий на панели инструментов
  switchCategory = (newCategory) => {
    this.openedCategory = newCategory;
  }

  /* ----------------------------------- Категория: файл ---------------------------------- */

  // переключение диалогов
  switchDialog = (value) => {
    this.mainDialog = value;
    this.importPath = '';
    this.saveAsPath = '';
  }

  // восстановить с диска
  restoreProjectFromDisk = () => {
    const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
      type: 'question',
      buttons: ['No', 'Yes'],
      title: 'Восстановить проект',
      message: 'Вы уверены, что хотите восстановить проект из сохраненной копии?\nВсе несохраненные изменения будут потеряны!'
    });
    if (choice === 1) {
      this.setWaiting('Восстановление проекта...');
      this.conn.import(this.dbLastSavedPath, false, (src, obj) => {
        this.unsavedChanges = false;
        this.render(obj.data, obj.zoom, obj.pan);
        this.setWaiting('');
      })
    }
  }

  // сохранить
  saveProjectListener = () => {
    this.conn.export(this.dbLastSavedPath, null, this.successListener)
  }

  saveDisabled = () => {
    return !this.unsavedChanges;
  }

  // сохранить как
  saveAsProjectListener = (fp) => {
    this.setWaiting('Сохранение проекта...');
    let pathWasAlreadyWithExtension = false;
    if (fp.endsWith('.gph')) {
      pathWasAlreadyWithExtension = true;
    } else {
      fp = fp + '.gph';
    }
    if (this.fs.existsSync(fp)) {
      if (this.fs.lstatSync(fp).isFile()) {
        if (pathWasAlreadyWithExtension) {
          // for Windows 10 at least: asks replace confirmation automatically, no need for second confirmation
          this.fs.unlink(fp, () => {
            this.conn.export(fp, null, this.successListener)
          })
        } else {
          const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
            type: 'question',
            buttons: ['No', 'Yes'],
            title: 'Файл существует!',
            message: 'Вы уверены, что хотите заменить существующий файл?'
          });
          if (choice === 1) {
            this.fs.unlink(fp, () => {
              this.conn.export(fp, null, this.successListener)
            })
          }
        }
      } else {
        const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
          type: 'question',
          buttons: ['No', 'Yes'],
          title: 'Папка существует!',
          message: 'Одноименная папка уже существует по этому пути. Вы уверены, что хотите удалить ее и сохранить файл вместо нее?'
        });
        if (choice === 1) {
          this.fs.rmdir(fp, { recursive: true }, () => {
            this.conn.export(fp, null, this.successListener)
          });
        }
      }
    } else {
      this.conn.export(fp, null, this.successListener)
    }
  }

  // импорт
  importProjectPathUpdateCallback = (filepaths) => {
    this.importPath = filepaths[0];
  }

  importFileExists = () => {
    return this.fs.existsSync(this.importPath) && this.fs.lstatSync(this.importPath).isFile();
  }

  importMerge = () => {
    //create property Person.name string
    this.setWaiting('Подготовка...');
    this.conn.import(this.importPath, true, (obj) => {
      let newIdMap = {};
      let newData = obj.data;
      newData.forEach((item) => newIdMap[item.id] = this.conn.nextId())
      newData.forEach((item) => {
        if (item.target && item.source) {
          item.target = newIdMap[item.target]
          item.source = newIdMap[item.source]
        }
        item.id = newIdMap[item.id]
      })
      this.cy.add(newData)
    });
  }

  // на кнопку закрыть проект
  closeProjectListener = () => {
    const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
      type: 'question',
      buttons: ['No', 'Yes'],
      title: this.unsavedChanges ? 'Есть несохраненные изменения!' : 'Закрыть проект',
      message: 'Вы уверены, что хотите закрыть проект?' + (this.unsavedChanges ? '\nЕсть несохраненные изменения!' : '')
    });
    if (choice === 1) {
      this.setWaiting('Закрытие проекта...');
      this.onClose(() => {
        this.backToStartView();
        this.setWaiting('');
      });
    }
  }

  /* ---------------------------------- Инициализация, финализация ------------------------------ */

  // закрытие всех соединений и удаление слушателей IPC
  private onClose = (callback) => {
    this.ipcRenderer.removeListener('has-unsaved-changes', this.hasUnsavedChangesListener);
    this.ipcRenderer.removeListener('quit-request', this.quitRequestListener);
    this.cy.destroy();
    this.conn.cy = null;
    this.cy = null;
    if (callback) callback();
  }

  ngAfterViewInit(): void {
    let params = this.getParams();
    let renderParams = ['data', 'zoom', 'pan'];
    for (let p in params) {
      if (!renderParams.includes(p)) this[p] = params[p]
    }
    this.setWindowTitle();
    this.conn.change.subscribe( value => {
      //console.log(value)
      this.unsavedChanges = value
    });

    this.ipcRenderer.on('has-unsaved-changes', this.hasUnsavedChangesListener);
    this.ipcRenderer.on('quit-request', this.quitRequestListener);

    this.render(params.data, params.zoom, params.pan);
  }
}
