import { Component, Input, ViewChild, NgZone, OnInit, ErrorHandler } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { DbServiceService } from '../db-service.service';
import { UpdateRecentService } from '../update-recent.service';
import { LastDirectoryService } from '../last-directory.service';
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

export class MainViewComponent implements OnInit {
  /* ---------------------------------------------------- private --------------------------------------------------- */
  constructor(
    private _electronService: ElectronService,
    private _updateRecentService: UpdateRecentService,
    private conn: DbServiceService,
    private _lastDirectoryService: LastDirectoryService,
    private _nz: NgZone
  ) { }

  private fs = this._electronService.remote.require('fs');
  private path = this._electronService.remote.require('path');
  private parseCSV = this._electronService.remote.require('csv-parse');
  private streamTransform = this._electronService.remote.require('stream-transform');
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
  @Input() reopenProject: (src) => {};
  @Input() setWaiting: (text) => {};
  @ViewChild('graph_field') graphField;

  /* ---------------------------------------------------- public --------------------------------------------------- */

  // диалоги и вуаль во время загрузки
  mainDialog : string = '';
  importSettings : any = {
    supportedTypes: this.conn.supportedTypes,
    path: '',
    format: '',
    params: [],
    demoSource: '',
    result: [],
    demoLineFrom: 1,
    demoLineTo: 3,
    className: '',
    isTipOpened: false,
    errorMessage: '',
    info: {},
    includeHeaders: [],
    headersType: [],
    headersNames: [],
    noHeaders: false,
    fileExists: false,
    validColumnNames: false
  }
  saveAsPath : string = '';
  
  public selection: OSelection = new OSelection([]);

  // инструменты, выделение
  openedCategory : string = 'selection';
  isRendering : boolean = false;
  edgeCurveEditingListeners : any = {
    id: null,
    tapstart: {},
    tapend: []
  };
  zoomStep = 0.4;
  readonly toolById = {
    select_move_any: {
      icon: 'assets/img/select.png',
      title: 'Выделение и перемещение элементов',
      appliableTo: 'node, edge',
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
      settings: {
        selectClass: {
          name: 'Класс новой вершины',
          order: 1,
          type: 'select',
          options: [],
          optionsConstructor: () => {
            return this.conn.getClassWithDescendants('V').map(c => {
              return {text: c.name, value: c.name}
            });
          },
          value: 'V'
        },
        newProps: {
          type: 'hidden',
          value: {}
        }
      },
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
      },
      onclick: (evt) => {
        let cl = this.toolById.new_vertex.settings['selectClass'].value
        let data = {
          id: this.conn.nextId(),
          class: cl
        };
        let propsOfNew: any = this.toolById.new_vertex.settings['newProps'].value
        for (let p in propsOfNew) {
          data[p] = propsOfNew[p]
        }
        this.cy.add([
          { group: 'nodes', data: data, position: evt.position }
        ]);
      }
    },
    new_edge: {
      icon: 'assets/img/new_edge.png',
      title: 'Создать ребро',
      appliableTo: 'node',
      settings: {
        selectClass: {
          name: 'Класс нового ребра',
          order: 1,
          type: 'select',
          options: [],
          optionsConstructor: () => {
            return this.conn.getClassWithDescendants('E').map(c => {
              return {text: c.name, value: c.name}
            });
          },
          value: 'E'
        },
        newProps: {
          type: 'hidden',
          value: {}
        },
        moved: {
          type: 'hidden',
          value: false
        },
        source: {
          type: 'hidden',
          value: null
        }
      },
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
      },
      onmousedown: (evt) => {
        console.log('new edge mousedown', evt.target)
        if (evt.target && evt.target != this.cy && evt.target.isNode()) {
          this.toolById.new_edge.settings['source'].value = evt.target;
        }
      },
      onmousemove: (evt) => {
        if (this.toolById.new_edge.settings['source'].value) {
          console.log('new edge mousemove')
          this.toolById.new_edge.settings['moved'].value = true;
        }
      },
      onmouseup: (evt) => {
        console.log('new edge mouseup', evt.target)
        let moved = this.toolById.new_edge.settings['moved'].value;
        let source = this.toolById.new_edge.settings['source'].value;
        if (evt.target && evt.target != this.cy && evt.target.isNode() && source && moved) {
          console.log('create edge')
          let cl = this.toolById.new_edge.settings['selectClass'].value
          let data = {
            id: this.conn.nextId(),
            class: cl,
            source: source.data('id'),
            target: evt.target.data('id')
          };
          let propsOfNew: any = this.toolById.new_edge.settings['newProps'].value
          for (let p in propsOfNew) {
            data[p] = propsOfNew[p]
          }
          this.cy.add([
            { group: 'edges', data: data }
          ]);
        }
        this.toolById.new_edge.settings['moved'].value = false;
        this.toolById.new_edge.settings['source'].value = null;
      }
    }
  };
  readonly controlsToolList = Object.keys(this.toolById);
  /*['zoom_out', 'zoom_in', 'zoom_auto', 'select_move_any', 'pan_view'];*/
  activeToolId = '';

  /* ---------------------------------------------------- public functions --------------------------------------------------- */

  //сейчас можно только один слушатель события одновременно, неважно на какой селектор
  setTool = (toolId) => {
    //console.log(`setTool(): new = ${toolId}, old = ${this.activeToolId}`)
    if (this.activeToolId) {
      this.cy.removeListener('tap');
      this.cy.removeListener('tapdrag');
      this.cy.removeListener('tapstart');
      this.cy.removeListener('tapend');
      this.cy.removeListener('mouseover');
      this.cy.removeListener('mouseout');
      this.cy.autoungrabify(true);
      this.cy.userPanningEnabled(true);
    }
    if (!this.toolById[toolId]) {
      console.log(`Warning: tried to set unknown tool '${toolId}'`);
      return;
    }
    let different = this.activeToolId != toolId

    this.activeToolId = toolId;
    let tool = this.toolById[toolId];
    let cursorPath = tool.icon.substring(0, tool.icon.length - 4) + '_cur_30x30.png';

    if (tool.oninit) tool.oninit();
    let funByEvent = {
      tap: tool.onclick,
      tapdrag: tool.onmousemove,
      tapstart: tool.onmousedown,
      tapend: tool.onmouseup,
      mouseover: (evt) => {
        this._nz.run(() => {
          if (!tool.appliableTo && evt.target != this.cy) return;
          this.graphField.nativeElement.style.cursor = `url('${cursorPath}'), pointer`;
        })
      },
      mouseout: (evt) => {
        this._nz.run(() => {
          if (!tool.appliableTo && evt.target != this.cy) return;
          this.graphField.nativeElement.style.cursor = `default`;
        })
      }
    }
    for (let event in funByEvent) {
      if (funByEvent[event]) {
        this.cy.on(event,
          tool.appliableTo ? tool.appliableTo : funByEvent[event],
          tool.appliableTo ? funByEvent[event] : undefined
        )
      }
    }

    if (tool.settings) {
      for (let s in tool.settings) {
        let obj = tool.settings[s]
        if (obj.optionsConstructor) obj.options = obj.optionsConstructor();
      }
    }
    if (different && (toolId == 'new_vertex' || toolId == 'new_edge')) {
      this.openedCategory = 'edit'
    }
    this.checkEdgeCurveEdit()
  }

  isActiveTool = (id) => {
    return this.activeToolId == id;
  }
  
  checkEdgeCurveEdit = () => {
    let sel = this.selection.getArray()
    let listeners = this.edgeCurveEditingListeners;

    if (sel.length != 1 || !sel[0].isEdge() || sel[0].data('id') != listeners.id
            || this.activeToolId != 'select_move_any') {
      this.cy.remove('.edge_bend_point')
      for (let selector in listeners.tapstart) {
        //console.log('remove tapstart', selector, listeners['tapstart'][selector], 'element id:', listeners.id)
        this.cy.removeListener('tapstart', selector, listeners['tapstart'][selector])
      }
      for (let listener of listeners.tapend) {
        //console.log('remove tapend', listener, 'element id:', listeners.id)
        this.cy.removeListener('tapend', listener)
      }
      
      listeners.id = null
      listeners.tapstart = {}
      listeners.tapend = []
    }

    if (sel.length == 1 && sel[0].isEdge() && sel[0].data('id') != listeners.id
             && this.activeToolId == 'select_move_any') {
      let e = sel[0]
      listeners.id = e.data('id')
      function findDistance(A, B) {
        return Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2))
      }
      function findAngle(A,B,C) {
        let atanA = Math.atan2(A.x - B.x, A.y - B.y);
        let atanC = Math.atan2(C.x - B.x, C.y - B.y);
        let diff = atanC - atanA;
        if (diff > Math.PI) diff -= 2*Math.PI;
        else if (diff < -Math.PI) diff += 2*Math.PI;
        return diff
      }
      let bendCoordinates = e.controlPoints()
      let bendDistances = e.style('control-point-distances')
      if (!bendDistances) bendDistances = [];
      else bendDistances = bendDistances.split(' ');
      let bendWeights = e.style('control-point-weights')
      if (!bendWeights) bendWeights = [];
      else bendWeights = bendWeights.split(' ');

      for (let i = 0; i < bendCoordinates.length; i++) {
        let moveBendPoint = false
        let tapStart = (evt) => {
          moveBendPoint = true
        }
        let tapEnd = (evt) => {
          //console.log('tapEnd:', evt, 'element id:', e.data('id'))
          if (moveBendPoint) {
            let angle = findAngle(evt.target.position(), e.sourceEndpoint(), e.targetEndpoint())
            let AC = findDistance(evt.target.position(), e.sourceEndpoint())
            /*console.log('positions: control:',
              evt.target.position(),
              ', edge source:',
              e.sourceEndpoint(),
              ', edge target:',
              e.targetEndpoint(),
              '; angle=', angle, ', AC=', AC
            )*/
            let d = Math.floor(Math.sin(angle) * AC)
            let w = Math.cos(angle) * AC / findDistance(e.sourceEndpoint(), e.targetEndpoint())
            //console.log('new d:', d, '; new w:', w)
            bendDistances[i] = d
            bendWeights[i] = w
            this.cy.style().selector(`[id = '${e.data('id')}']`).style({
              'control-point-distances': bendDistances.join(' '),
              'control-point-weights': bendWeights.join(' ')
            }).update()
            /*console.log('control bend point: id:', e.data('id'), '; d:',
              e.style('control-point-distances'), '; w:', e.style('control-point-weights'))*/
          }
          moveBendPoint = false
        }
        let id = 'move-bend-'+i
        let selector = `[id = '${id}']`
        this.cy.on('tapstart', selector, tapStart)
        listeners['tapstart'][selector] = tapStart

        this.cy.on('tapend', tapEnd)
        listeners['tapend'].push(tapEnd)

        this.cy.add([
          {
            group: 'nodes',
            data: {
              id: id
            },
            classes: ['edge_bend_point'],
            position: bendCoordinates[i]
          }
        ]).unselectify();
      }

      let moveSourcePoint = false
      let sourceTapStart = (evt) => {
        moveSourcePoint = true
      }
      let sourceTapEnd = (evt) => {
        if (moveSourcePoint) {
          moveSourcePoint = false
          if (evt.target && evt.target != this.cy && evt.target.isNode() && !evt.target.data('id').startsWith('move-')) {
            //console.log(evt.target)
            e.move({
              source: evt.target.data('id')
            });
            e.unselect()
            e.select()
          } else {
            let el = this.conn.getById('move-source')
            if (el) el.position(e.sourceEndpoint())
          }
        }
      }
      let sourceId = 'move-source'
      let sourceSelector = `[id = '${sourceId}']`
      this.cy.on('tapstart', sourceSelector, sourceTapStart)
      listeners['tapstart'][sourceSelector] = sourceTapStart

      this.cy.on('tapend', sourceTapEnd)
      listeners['tapend'].push(sourceTapEnd)

      this.cy.add([
        {
          group: 'nodes',
          data: {
            id: sourceId
          },
          classes: ['edge_bend_point'],
          position: e.sourceEndpoint()
        }
      ]).unselectify();

      let moveTargetPoint = false
      let targetTapStart = (evt) => {
        moveTargetPoint = true
      }
      let targetTapEnd = (evt) => {
        if (moveTargetPoint) {
          moveTargetPoint = false
          if (evt.target && evt.target != this.cy && evt.target.isNode() && !evt.target.data('id').startsWith('move-')) {
            //console.log(evt.target)
            e.move({
              target: evt.target.data('id')
            });
            e.unselect()
            e.select()
          } else {
            let el = this.conn.getById('move-target')
            if (el) el.position(e.targetEndpoint())
          }
        }
      }
      let targetId = 'move-target'
      let targetSelector = `[id = '${targetId}']`
      this.cy.on('tapstart', targetSelector, targetTapStart)
      listeners['tapstart'][targetSelector] = targetTapStart

      this.cy.on('tapend', targetTapEnd)
      listeners['tapend'].push(targetTapEnd)

      this.cy.add([
        {
          group: 'nodes',
          data: {
            id: targetId
          },
          classes: ['edge_bend_point'],
          position: e.targetEndpoint()
        }
      ]).unselectify();

      this.conn.getById('move-source').lock()
      this.conn.getById('move-target').lock()
    }
  }

  // полный ререндер. вызывать только в случае импорта, sql запроса или другого изменения графа не через cytoscape
  render = (data, style, zoom, pan) => {
    this.isRendering = true;
    if (!style) {
      style = [
        {
          selector: 'core',
          style: {
            'active-bg-size': 0
          }
        },
        {
          selector: 'node',
          style: {
            'background-color': '#ffaa33',
            'label': 'data(id)'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'label': 'data(id)',
            'line-color': '#000000',
            'target-arrow-color': '#000000',
            'target-arrow-shape': 'triangle',
            'curve-style': 'unbundled-bezier',
            'control-point-distances': '50 -50',
            'control-point-weights': '0.2 0.8'
          }
        },
        {
          selector: '.edge_bend_point',
          style: {
            'label': '',
            'shape': 'square',
            'width': 10,
            'height': 10,
            'background-color': '#ddddff',
            'border-width': 1,
            'border-style': 'solid',
            'border-color': 'grey'
          }
        },
        {
          selector: ':selected',
          style: {
            'background-color': '#228c15',
            'line-color': '#0000aa',
            'target-arrow-color': '#0000aa',
            'source-arrow-color': '#0000aa'
          }
        },
        {
          selector: '.cy_hidden',
          style: {
            'opacity': '0.1'
          }
        },
        {
          selector: '.cy_edit_hidden',
          style: {
            'opacity': '0.25'
          }
        }
      ]
    }
    //console.log('style:', style)
    this.cy = cytoscape({
      container: this.graphField.nativeElement,
      elements: data,
      layout: {
        name: 'preset',
        fit: true
      },
      style: style,
      userZoomingEnabled: false,
      userPanningEnabled: true,
      autoungrabify: true,
      autounselectify: true
    })
    this.cy.gridGuide({
      snapToGridOnRelease: false,
      snapToGridDuringDrag: false,
      snapToAlignmentLocationOnRelease: false,
      snapToAlignmentLocationDuringDrag: false,
      panGrid: true
    })

    // импорт не вызывает рендер, вызывает только инит и восстановление, поэтому очищаем
    this.selection.splice(0, this.selection.length);
    this.selection.pushAll(this.cy.$(':selected'));
    let selectionUpdate = (event) => {
      if (event.type == 'select') {
        this.selection.push(event.target);
      } else if (event.type == 'unselect' || event.type == 'remove') {
        this.selection.remove(event.target);
      }
      this.checkEdgeCurveEdit()
      console.log('this.selection: ', this.selection);
    }
    this.cy.on('select', selectionUpdate)
    this.cy.on('unselect', selectionUpdate)
    this.cy.on('remove', selectionUpdate)
    this.cy.viewport({
      zoom: zoom,
      pan: pan
    });

    let catchChanges = (event) => {
      if (!event.target.hasClass('edge_bend_point')) {
        this.unsavedChanges = true
      }
    }
    this.cy.on('add remove move select unselect tapselect tapunselect boxselect box lock', catchChanges)
    this.cy.on('data', 'node, edge', catchChanges)
    this.checkEdgeCurveEdit();
    
    this.conn.cy = this.cy;
    this.conn.export(this.dbLastSavedPath, null, (src, obj)=>{
      console.log('Exported with initial style.')
    }, (e)=>{
      console.log('Failed to save after initial style commit.')
    })
    this.setTool(this.activeToolId);
    this.isRendering = false;
  }

  // переключатель категорий на панели инструментов
  switchCategory = (newCategory) => {
    this.openedCategory = newCategory;
  }

  /* ----------------------------------- Категория: файл ---------------------------------- */

  // переключение диалогов
  switchDialog = (value) => {
    this.mainDialog = value;
    this.importResetSettings()
    this.importSettings.path = '' // формат остается
    this.importSettings.fileExists = false
    this.importSettings.validColumnNames = false
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
      this.onClose(() => {
        this.reopenProject(this.dbLastSavedPath)
      })
    }
  }

  // сохранить
  saveProjectListener = () => {
    this.conn.export(this.dbLastSavedPath, null, this.successListener, (err) => {
      this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
        type: 'warning',
        buttons: ['OK'],
        title: 'Ошибка',
        message: `Не удалось сохранить проект по указанному пути:\n${this.dbLastSavedPath}\n${err.message}`
      })
    })
  }

  saveDisabled = () => {
    return !this.unsavedChanges;
  }

  saveAsProjectListener() {
    const remote = this._electronService.remote;
    remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
        title: 'Сохранить как',
        filters: [
          { name: 'Graphytica projects (.gph)', extensions: ['gph'] },
          { name: 'All files', extensions: ['*'] }
        ],
        defaultPath: this._lastDirectoryService.value || remote.app.getPath('documents') || remote.app.getPath('home') || ".",
      })
      .then((result) => {
        if (result && result.filePath) {
          let path = result.filePath;
          this._lastDirectoryService.value = path.substring(0, path.lastIndexOf(this.path.sep));
          this.saveAs(result.filePath);
        }
      });
  }

  // сохранить как
  saveAs = (fp) => {
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
            this.conn.export(fp, null, this.successListener, (err) => {
              this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
                type: 'warning',
                buttons: ['OK'],
                title: 'Ошибка',
                message: `Не удалось сохранить проект по указанному пути:\n${fp}\n${err.message}`
              })
            })
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
              this.conn.export(fp, null, this.successListener, (err) => {
                this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
                  type: 'warning',
                  buttons: ['OK'],
                  title: 'Ошибка',
                  message: `Не удалось сохранить проект по указанному пути:\n${fp}\n${err.message}`
                })
              })
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
            this.conn.export(fp, null, this.successListener, (err) => {
              this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
                type: 'warning',
                buttons: ['OK'],
                title: 'Ошибка',
                message: `Не удалось сохранить проект по указанному пути:\n${fp}\n${err.message}`
              })
            })
          });
        }
      }
    } else {
      this.conn.export(fp, null, this.successListener, (err) => {
        this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
          type: 'warning',
          buttons: ['OK'],
          title: 'Ошибка',
          message: `Не удалось сохранить проект по указанному пути:\n${fp}\n${err.message}`
        })
      })
    }
  }

  /* ---------------------------------------------- Импорт --------------------------------------------------- */

  importResetSettings = () => {
    this.importSettings.demoSource = ''
    this.importSettings.result = []
    this.importSettings.demoLineFrom = 1
    this.importSettings.demoLineTo = 3
    this.importSettings.className = ''
    this.importSettings.errorMessage = ''
    this.importSettings.info = {}
    this.importSettings.includeHeaders = []
    this.importSettings.headersType = []
    this.importSettings.headersNames = []
    this.importSettings.noHeaders = false
  }

  importProjectPathUpdateCallback = (filepaths) => {
    this.importSettings.path = filepaths[0];
    this.importSettings.fileExists = this.fs.existsSync(this.importSettings.path)
                                       && this.fs.lstatSync(this.importSettings.path).isFile();
    if (this.importSettings.format == 'csv' && this.importSettings.path && this.importFileExists()) {
      this.importResetSettings()
      this.importUpdateParsedCSV(true)
    }
  }

  importFileExists = () => {
    return this.fs.existsSync(this.importSettings.path) && this.fs.lstatSync(this.importSettings.path).isFile();
  }

  importOpenExternalDocs(name) {
    this.ipcRenderer.send('external-docs', name);
  }

  importSwitchValueTip() {
    this.importSettings.isTipOpened = !this.importSettings.isTipOpened
  }

  setImportActiveParamType(name, type) {
    let settingsEntry = this.importSettings.params.find(s => s.name == name)
    console.log(type)
    settingsEntry.activeType = type
  }

  setImportDemoLine(mode, lineNumber) {
    if (mode == 'from') {
      this.importSettings.demoLineFrom = parseInt(lineNumber) || 1;
    } else if (mode == 'to') {
      this.importSettings.demoLineTo = parseInt(lineNumber) || 1;
    }
  }
  
  setImportIncludeHeader(header) {
    this.importSettings.includeHeaders[header] = !this.importSettings.includeHeaders[header]
  }
  
  setImportHeaderType(header, value) {
    this.importSettings.headersType[header] = value
  }

  setImportHeaderName(header, event) {
    var element = event.target || event.srcElement || event.currentTarget;
    
    if (element.value.includes('\n') || element.value.includes('\r')) {
      element.value = this.trim(this.cutForbidden(element.value))
      element.blur()
      return;
    }
    element.value = this.cutForbidden(element.value)
    let value = this.trim(element.value)

    if (this.isFieldNameInvalid(header, value)) {
      if (element.className.indexOf('invalid_input') < 0) {
        element.className += ' invalid_input';
        this.importSettings.validColumnNames = false;
      }
    } else {
      element.className = element.className.replace(/\s*invalid_input/g, '');
      this.importSettings.headersNames[header] = value
      const included = this.importSettings.headersNames.filter((h, i) => {
        return this.importSettings.includeHeaders[i];
      })
      this.importSettings.validColumnNames = included.length > 0 
                                          && !included.some((h, index) => this.isFieldNameInvalid(index, h))
    }
  }

  setImportNoHeaders(value) {
    this.importSettings.noHeaders = !!value
    if (this.importSettings.result && this.importSettings.result[0].length > 0) {
      let headersRow = value ? 
                  Array.from(Array(this.importSettings.result[0].length).keys()) : this.importSettings.result[0]
      for (let i = 0; i < headersRow.length; i++) {
        this.importSettings.headersNames[i] = ''+headersRow[i]
      }
    }
  }

  hasForbidden(propOrClassName) {
    return propOrClassName.search(/[\n\t\r\0]/g) >= 0
  }

  isFieldNameInvalid(j, propName) {
    propName = this.cutForbidden(this.trim(propName))
    let hasForbidden = this.hasForbidden(propName)
    let commonForbidden = propName == 'id' || propName == 'class' || propName == 'parent'
    if (!propName || hasForbidden || commonForbidden) return true;

    let colliding = this.importSettings.headersNames.filter((v, index) => j != index).indexOf(propName) >= 0
    return colliding;
  }
  
  isClassNameInvalid(newClass) {
    newClass = this.trim(newClass)
    return (newClass == '' || this.conn.classesMap[newClass])
  }

  trim(string) {
    return string.trim().replace(/\s\s+/g, ' ')
  }

  cutForbidden(string) {
    string = string.replace(/[\n\r\t\0]/g, ' ')
    return string
  }

  setImportNewClassName(event) {
    var element = event.target || event.srcElement || event.currentTarget;
    
    if (element.value.includes('\n') || element.value.includes('\r')) {
      element.value = this.trim(this.cutForbidden(element.value))
      element.blur()
      return;
    }
    element.value = this.cutForbidden(element.value)
    let value = this.trim(element.value)

    if (this.isClassNameInvalid(value)) {
      if (element.className.indexOf('invalid_input') < 0) {
        element.className += ' invalid_input';
      }
    } else {
      element.className = element.className.replace(/\s*invalid_input/g, '');
      this.importSettings.className = value
    }
  }

  setImportSettings(name, element) {
    let settingsEntry = this.importSettings.params.find(s => s.name == name)
    let type = settingsEntry.activeType || settingsEntry.type
    let value = (type == 'boolean') ? element.checked : element.value;

    function replaceSpecial(string) {
      string = string.replace('\\\\', '\\')
      string = string.replace('\\n', '\n')
      string = string.replace('\\r', '\r')
      string = string.replace('\\t', '\t')
      string = string.replace('\\0', '\0')
      string = string.replace('\\s', ' ')
      //\u0000 to \u10FFFF
      let regex = /\\u([a-fA-F\d]{4,6})/g
      string = string.replace(regex, (match, code) => {
        return String.fromCharCode(parseInt(code, 16))
      })
      return string
    }

    if (type == 'string') {
      value = replaceSpecial(value)
      settingsEntry.value = value
    } else if (type == 'string[]') {
      value = replaceSpecial(value)
      settingsEntry.value = value.split(' ')
    } else if (type == 'integer') {
      settingsEntry.value = parseInt(value)
    } else if (type == 'boolean') {
      settingsEntry.value = !!value
    } else if (type == 'select') {
      if (settingsEntry.enum.includes(value)) settingsEntry.value = value
    } else if (type == 'char') {
      value = replaceSpecial(value)
      if (value.length > 1 && element.className.indexOf('invalid_input') < 0) {
        element.className += ' invalid_input';
      } else {
        element.className = element.className.replace(/\s*invalid_input/g, '');
        settingsEntry.value = value
      }
    } else if (type == 'char[]') {
      value = replaceSpecial(value)
      let valid = value.split(' ').every(e => e.length <= 1)

      if (!valid && element.className.indexOf('invalid_input') < 0) {
        element.className += ' invalid_input';
      } else {
        element.className = element.className.replace(/\s*invalid_input/g, '');
        settingsEntry.value = value
      }
    } else if (type.startsWith('function')) {
      let functionBody = value
      let blackList = ['Worker', 'WebSocket', 'XMLHttpRequest', 'WorkerGlobalScope', 'DOMRequest', 'DOMCursor',
        'WorkerLocation', 'WorkerNavigator', 'Crypto', 'Fetch', 'Headers', 'FetchEvent', 'BroadcastChannel',
        'Request', 'Response', 'Notification', 'Performance', 'PerformanceEntry', 'PerformanceMeasure', 
        'PerformanceMark', 'PerformanceObserver', 'PerformanceResourceTiming', 'FormData', 'ImageData', 'IndexedDB',
        'NotificationEvent', 'ServiceWorkerGlobalScope', 'ServiceWorkerRegistration', 'FileReader', 'File', 'Blob',
        'NetworkInformation', 'MessageChannel', 'MessagePort', 'PortCollection', 'SharedWorker', 'DataTransfer',
        'HTMLCanvasElement', 'FileSystemHandle', 'FileSystemFileHandle', 'FileSystemDirectoryHandle',
        'DataTransferItem', 'FileSystemWritableFileStream', 'Stream', 'WriteableStream', 'ReadableStream',
        'FileSystemFileEntry', 'FileSystemDirectoryEntry', 'FileReaderSync', 'FileList', 'URL',
        'ReadableStreamDefaultController', 'ReadableStreamDefaultReader', 'WritableStreamDefaultWriter', 
        'WritableStreamDefaultController', 'Body', 'ReadableStreamBYOBReader', 'ReadableByteStreamController',
        'ReadableStreamBYOBRequest', 'EventSource', 'WebGLRenderingContext', 'WebGL2RenderingContext',
        'WebGLActiveInfo', 'WebGLBuffer', 'WebGLContextEvent', 'WebGLFramebuffer', 'WebGLProgram', 'WebGLQuery',
        'WebGLRenderbuffer', 'WebGLSampler', 'WebGLShader', 'WebGLShaderPrecisionFormat', 'WebGLSync', 'WebGLTexture',
        'WebGLTransformFeedback', 'WebGLUniformLocation', 'WebGLVertexArrayObject', 'OffscreenCanvas',
        'DedicatedWorkerGlobalScope', 'SharedWorkerGlobalScope', 'Window', 'WindowOrWorkerGlobalScope',
        'AnalyserNode', 'Animation', 'AnimationEvent', 'AnimationTimeline',
        'ApplicationCache', 'Cache', 'CacheStorage', 'CanvasRenderingContext2D', 'CaretPosition', 'ChannelMergerNode',
        'CharacterData', 'ClientRect', 'ClientRectList', 'Clipboard', 'ClipboardEvent', 'CloseEvent',
        'Comment', 'CompositionEvent', 'ConstantSourceNode', 'ConvolverNode', 'CountQueuingStrategy', 'Credential',
        'CredentialsContainer', 'CryptoKey', 'CryptoKeyPair', 'CustomElementRegistry', 'Audio', 'AudioBuffer', 
        'AudioBufferSourceNode', 'AudioContext', 'AudioDestinationNode', 'AudioListener', 'AudioNode', 'AudioParam',
        'AudioParamMap', 'AudioProcessingEvent', 'AuthenticatorAssertionResponse', 'AuthenticatorAttestationResponse',
        'DataCue', 'DataView', 'External', 'IDBDatabase', 'MediaDevices', 'MediaDeviceInfo', 'MessageEvent',
        'MessagePort', 'MessageChannel', 'Location', 'Gamepad', 'GamepadEvent', 'Reflect', 'ShadowRoot', 'SourceBuffer',
        'SourceBufferList', 'Storage', 'StorageEvent', 'StorageManager', 'StyleSheet', 'StyleSheetList', 'SubtleCrypto',
        'SyncManager', 'SyntaxError', 'PageTransitionEvent', 'PaymentRequest', 'PaymentResponse', 'Permissions', 'Plugin',
        'PointerEvent', 'PromiseRejectionEvent', 'PushSubscription', 'XMLDocument', 'XMLHttpRequestUpload',
        'XMLSerializer', 'XPathEvaluator', 'XPathExpression', 'XPathResult',

        'export', 'class', 'navigator', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'importScripts',
        'Promise', 'clearInterval', 'clearTimeout', 'dump', 'implements', 'constructor', 'set', 'get', 'async', 'await',
        'Function', 'function', 'require', 'import', 'call', 'apply', 'bind', 'prototype', '__proto__',
        'process', 'global', 'Agent', 'read', 'write', 'http', 'FileSystem', 'NavigationPreloadManager',
        'Navigator', 'void', 'private', 'public', 'crypto', 'customElements', 'debugger', 'default', 'dispatchEvent',
        'departFocus', 'devicePixelRatio', '__dirname', '__filename', 'addEventListener', 'alert', 'applicationCache',
        'blur', 'caches', 'cancelAnimationFrame', 'captureEvents', 'clearImmediate', 'clientInformation',
        'defaultStatus', 'doNotTrack', 'document', 'console', 'confirm', 'prompt', 'eval', 'exports', 'extends',
        'external', 'createElement', 'getElementById', 'getElementsByClassName', 'querySelector', 'this', 'Proxy',
        'proxy', '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'hasOwnProperty',
        'isPrototypeOf', 'propertyIsEnumerable', 'setPrototypeOf', 'caller', 'innerHeight', 'innerWidth', 'innerSubscribe',
        'InnerSubscriber', 'interface', 'isSecureContext', 'kill', 'exception', 'event', 'Exception', 'throw', 'throws',
        'invoke', 'invokeMethod', 'invokeMethodAsync', 'ajax', 'globalThis', 'visualViewport', 'fetch', 'focus',
        'frameElement', 'frames', 'top', 'screenLeft', 'screenTop', 'screenX', 'screenY', 'Screen', 'ScreenOrientation',
        'outerHeight', 'outerWidth', 'history', 'History', 'localStorage', 'location', 'locationbar', 'log',
        'VisualViewport', 'Element', 'Error', 'ErrorEvent', 'ErrorHandler', 'ExtensionScriptApis',
        'webkitURL', 'window', 'document', 'dump', 'yield', 'queueMicrotask', 'scroll', 'scrollBy', 'scrollTo', 'scrollX',
        'scrollY', 'scrollbars', 'self', 'package', 'pageXOffset', 'pageYOffset', 'parent', 'performance', 'personalbar',
        'postMessage', 'print', 'exec', 'run', 'execSync', 'dialog', 'electron', 'quit', 'sessionStorage', 'super',
        'spawn', 'spawnSync', 'moveBy', 'moveTo', 'webContents', 'loadURL', '_baseURL', '_htc',

        'BrowserWindow', 'ipcRenderer', 'ipcMain', 'MainViewComponent',
        'Electron', 'Node', 'NodeFilter', 'NodeIterator', 'NodeJS', 'NodeList',
        'Component', 'Input', 'ViewChild', 'NgZone', 'OnInit', 'ElectronService', 'DbServiceService',
        'UpdateRecentService', 'LastDirectoryService', 'OSelection', 'cytoscape', 'cola', 'gridGuide'
      ]

      let notSecure = false;
      for (let str of blackList) {
        const regex =  new RegExp(`\b${str}\b`, 'g');
        let found = functionBody.search(regex) >= 0
        notSecure = notSecure || found
        //console.log('forbidden check: found =', found, ', regex =', regex, ', str =', str, ', match =', functionBody.match(regex))
      }
      if (notSecure) {
        console.log('forbiddenVarsClassesInterfaces')
        return
      }
      const lambda = /=>/g
      notSecure = notSecure || (functionBody.search(lambda) >= 0)
      if (notSecure) {
        console.log('lambda')
        return
      }

      if (type == 'function(stringValue, context)') {
        let fn = new Function('stringValue', 'context', functionBody)
        let wrapper = (stringValue, context) => {
          let globallyAvailable = {};
          for (let p in window) {
            if (!blackList.includes(p)) console.log(p)
            globallyAvailable[p] = null
          }
          for (var p in this) {
            globallyAvailable['' + p] = null;
          }
          console.log(globallyAvailable)
          return fn.call(globallyAvailable, stringValue, context)
        }
        settingsEntry.value = wrapper
      } else {
        let fn = new Function('stringValue', functionBody)
        let wrapper = (stringValue) => {
          let globallyAvailable = {};
          for (let p in window) {
            if (!blackList.includes(p)) console.log(p)
            globallyAvailable[p] = null
          }
          for (var p in this) {
            globallyAvailable['' + p] = null;
          }
          console.log(globallyAvailable)
          /*{
            window: null,
            document: null,
            console: null,
            alert: null,
            prompt: null,
            confirm: null,
            setInterval: null,
            setTimeout: null,
            clearInterval: null,
            clearTimeout: null,
            dump: null,
            process: null
          }*/
          return fn.call(globallyAvailable, stringValue)
        }
        settingsEntry.value = wrapper
      }
    }
    console.log(name, type, settingsEntry.value)
  }

  setImportFormat = (format) => {
    this.importSettings.format = format;
    if (format == 'csv') {
      this.importSettings.params = [
        {
          name: 'bom',
          type: 'boolean',
          title: 'Если true, найти и исключить метку порядка байтов (BOM) из входного файла CSV, если она есть.',
          value: false
        },{
          name: 'cast',
          type: ['boolean', 'function(stringValue,context)'],
          title: 'Если true, парсер будет пытаться конвертировать значения в нативные типы данных. Если задано функцией, то она принимает (1)строку-значение столбца (stringValue) и (2)контекст (context) в качестве аргументов и должна возвращать сконвертированное значение.',
          value: false,
          activeType: 'boolean'
        },{
          name: 'cast_date',
          type: ['boolean', 'function(stringValue)'],
          title: 'Если true, парсер будет пытаться конвертировать строки в даты (стандартным методом Date.parse). Если задано функцией, то она принимает строку (stringValue) в качестве аргумента и должна возвращать объект Date. Работает только при включенном cast.',
          value: false,
          activeType: 'boolean'
        },{
          name: 'comment',
          type: 'string',
          title: 'Считать символы после указанной строки за комментарий. Оставить пустым для отключения. По умолчанию отключено.',
          value: undefined
        },{
          name: 'delimiter',
          type: 'string[]',
          title: 'Одна или несколько строк через пробел, распознающихся как разделители столбцов (для разделителей, содержащих пробелы, заменить их на \\s). По умолчанию , (запятая).',
          value: ','
        },{
          name: 'encoding',
          type: 'select',
          enum: ['utf8', 'ucs2', 'utf16le', 'latin1', 'ascii', 'base64', 'hex'],
          title: 'Кодировка. По умолчанию utf8.',
          value: 'utf8'
        },{
          name: 'escape',
          type: 'char',
          title: 'Экранирующий символ. Применяется только к символам кавычек и экранирующим символам внутри значений, заключенных в кавычки. По умолчанию " (двойная кавычка).',
          value: '"'
        },{
          name: 'from',
          type: 'integer',
          title: 'Начать обработку записей с определенного количества записей (первая запись идет под номером 1).',
          value: undefined
        },{
          name: 'from_line',
          type: 'integer',
          title: 'Начать обработку записей с определенного номера строки.',
          value: undefined
        },{
          name: 'ltrim',
          type: 'boolean',
          title: 'Если true, игнорировать пробелы сразу после разделителя (т.е. удалить пробелы в начале значений столбцов). По умолчанию false. Не действует на пробелы в кавычках.',
          value: false
        },{
          name: 'max_record_size',
          type: 'integer',
          title: 'Максимально допустимое количество символов в буфере при чтении записи, иначе выдать ошибку. Задать на случай неверных delimiter или record_delimiter. Также предотвращает переполнение памяти при попытке чтения CSV с нарушенной структурой.',
          value: undefined
        },{
          name: 'quote',
          type: 'char',
          title: 'Символ, который распознается как кавычки вокруг значения поля. Оставить пустым для отключения распознавания кавычек. По умолчанию символ " (двойная кавычка).',
          value: '"'
        },{
          name: 'record_delimiter',
          type: 'char[]',
          title: 'Один или несколько символов через пробел, которые распознаются как разделители записей (для разделителя-пробела ввести \\s). По умолчанию - определить автоматически (для Linux - "\\n", Apple - "\\r", Windows - "\\r\\n")',
          value: undefined
        },{
          name: 'relax',
          type: 'boolean',
          title: 'Сохранять символ кавычки внутри значений, не заключенных в кавычки.',
          value: false
        },{
          name: 'relax_column_count',
          type: 'boolean',
          title: 'Не выдавать ошибку, если две строки имеют разное количество столбцов. По умолчанию false.',
          value: false
        },{
          name: 'relax_column_count_less',
          type: 'boolean',
          title: 'Аналогично relax_column_count, но применяется только к строкам, содержащим столбцов меньше, чем ожидалось.',
          value: false
        },{
          name: 'relax_column_count_more',
          type: 'boolean',
          title: 'Аналогично relax_column_count, но применяется только к строкам, содержащим столбцов больше, чем ожидалось.',
          value: false
        },{
          name: 'rtrim',
          type: 'boolean',
          title: 'Если true, игнорировать пробелы сразу перед разделителем (т.е. удалить пробелы в конце значений столбцов). По умочанию false. Не действует на пробелы в кавычках.',
          value: false
        },{
          name: 'skip_empty_lines',
          type: 'boolean',
          title: 'Пропускать пустые строки (соответствует рег.выражению /^$/). По умолчанию false.',
          value: false
        },{
          name: 'skip_lines_with_empty_values',
          type: 'boolean',
          title: 'Пропускать строки, в которых есть пустые значения столбцов (соответствует рег.выражению /\s*/), пустой Buffer или равно null и undefined, если использовалась опция cast. По умолчанию false.',
          value: false
        },{
          name: 'skip_lines_with_error',
          type: 'boolean',
          title: 'Пропускать строки, при обработке которых возникла ошибка. Когда отключено, ошибка прерывает чтение записей. По умолчанию false',
          value: false
        },{
          name: 'to',
          type: 'integer',
          title: 'Закончить обработку записей после определенного количества записей.',
          value: undefined
        },{
          name: 'to_line',
          type: 'integer',
          title: 'Закончить обработку записей на определенном номере строки.',
          value: undefined
        },{
          name: 'trim',
          type: 'boolean',
          title: 'Если true, игнорировать пробелы сразу перед и после разделителя. По умолчанию false. Не действует на пробелы в кавычках.',
          value: false
        }
      ]
      if (this.importSettings.path && this.importFileExists()) {
        this.importUpdateParsedCSV(true)
      }
    } else if (!format) {
      this.importSettings.params = []
    }
    this.importResetSettings()
  }

  import = (isDemo) => {
    //create property Person.name string
    if (!isDemo) this.setWaiting('Подготовка...');
    try {
      if (this.importSettings.format == '') {
        this.conn.import(this.importSettings.path, true, this.merge, (err) => {
          this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
            type: 'warning',
            buttons: ['OK'],
            title: 'Ошибка',
            message: `При импорте возникла ошибка. \n${err.message}
              Возможно вы пытаетесь импортировать неподдерживаемый тип файла, неправильно указали
              тип файла или файл поврежден.`
          })
          this.setWaiting('');
        });
      } else if (this.importSettings.format == 'csv') {
        this.importUpdateParsedCSV(isDemo)
      }
    } catch (err) {
      this.importSettings.errorMessage = `При импорте возникла ошибка. \n${err.message}
        Возможно вы пытаетесь импортировать неподдерживаемый тип файла, неправильно указали
        тип файла или файл поврежден.`
        this.setWaiting('');
    }
  }

  importUpdateParsedCSV(isDemo) {
    const importSettings = this.importSettings
    const conn = this.conn
    const cy = this.cy
    const setWaiting = this.setWaiting
    const switchDialog = this.switchDialog
    const isFieldNameInvalid = this.isFieldNameInvalid.bind(this)

    let params: any = {};
    for (let param of importSettings.params) {
      params[param.name] = param.value
    }

    if (isDemo) {
      params.from = importSettings.demoLineFrom
      params.to = importSettings.demoLineTo
      params.raw = true
    }

    importSettings.errorMessage = ''
    importSettings.demoSource = ''
    importSettings.result = []
    //console.log('importUpdateParsedCSV() params', params)

    //const output = []
    //const parser = this.parseCSV(params)
    /*const collector = this.streamTransform(function(record, callback){
      //console.log(record[0])
      console.log(record)
      if (isDemo) {
        importSettings.demoSource += record.raw + '\n'
        importSettings.result.push(record.record)
      } else {
        importSettings.result.push(record)
      }
      callback(null, record);
    }, {
      parallel: 40
    })*/
    const handleError = function(where, error) {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', where, error)
      importSettings.errorMessage = `Error in ${where}:\n\n${error.name}: ${error.message}`
      for (let p in error) {
        if (p != 'stack') {
          importSettings.errorMessage += `\n${p}: ${error[p]}`
        }
      }
    }

    let parser:any = {}
    
    this.fs.createReadStream(importSettings.path)
      .on('error', function(err){
        //console.error(err.message)
        handleError('reader', err)
        parser.end()
      })
      .on('end', function(){
        console.log('reader.end()')
        parser.end()
      })
      .setEncoding(importSettings.params.encoding)
      .pipe(
        parser = this.parseCSV(params)
        .on('data', function(csvrow) {
          console.log(csvrow);
          if (csvrow) {
            if (isDemo) {
              importSettings.demoSource += csvrow.raw + '\n'
              importSettings.result.push(csvrow.record)
            } else {
              importSettings.result.push(csvrow)
            }
          }
          importSettings.info = parser.info
        })
        .on('error', function(error) {
          //console.log('parser error', error);
          handleError('parser', error)
          parser.end()
        })
        .on('end', function() {
          console.log('parser end', importSettings.result);
          importSettings.info = parser.info
          // handle end of CSV
          //console.log('parser end, parser =', parser)
          //console.log('parser info', importSettings.info)
    
          /*importSettings.includeHeaders = []
          importSettings.headersType = []
          importSettings.headersNames = []*/
          let headersRow = importSettings.noHeaders ? 
                      Array.from(Array(importSettings.result[0].length).keys()) : importSettings.result[0]

          let sameHeaders = importSettings.headersNames.every((e, index) => e == headersRow[index])
                                  && importSettings.headersNames.length == headersRow.length

          console.log('sameHeaders:', sameHeaders)
          if (importSettings.headersNames.length == 0 || !sameHeaders) {
            for (let i = 0; i < headersRow.length; i++) {
              importSettings.includeHeaders[i] = true
              importSettings.headersType[i] = 'string'
              importSettings.headersNames[i] = ''+headersRow[i]
            }
            const included = importSettings.headersNames.filter((h, i) => {
              return importSettings.includeHeaders[i];
            })
            importSettings.validColumnNames = included.length > 0 
                                                && !included.some((h, index) => isFieldNameInvalid(index, h))
            //console.log('validColumns:', importSettings.validColumnNames)
          }
          //console.log('importSettings.includeHeaders, importSettings.headersType, importSettings.headersNames', importSettings.includeHeaders, importSettings.headersType, importSettings.headersNames)
    
          if (!isDemo && importSettings.className) {
            let properties = {}
            for (let i = 0; i<headersRow.length; i++) {
              if (importSettings.includeHeaders[i]) {
                let propName = importSettings.headersNames[i]
                properties[propName] = {
                  type: importSettings.headersType[i]
                }
              }
            }
            conn.createClass(importSettings.className, 'V', properties)
    
            let data = []
            let {x, y} = cy.pan()
            let side = Math.floor(Math.sqrt(importSettings.result.length));
            for (let i = importSettings.noHeaders ? 0 : 1; i < importSettings.result.length; i++) {
              let row = importSettings.result[i]
              let plainElement = {
                group: 'nodes',
                data: {
                  id: conn.nextId(),
                  class: importSettings.className
                },
                position: {
                  x: x + (i % side) * 40,
                  y: y + ((i - i % side) / side) * 40
                }
              }
              for (let j = 0; j<row.length; j++) {
                let include = importSettings.includeHeaders[j]
                let name = importSettings.headersNames[j]
                //console.log('data', include, name)
                if (include) {
                  plainElement.data[name] = row[j]
                }
              }
    
              console.log('plainElement:', plainElement)
              data.push(plainElement)
            }
    
            cy.add(data)
            setWaiting('');
            switchDialog('');
          }
        })
      );
  }

  merge = (src, obj) => {
    if (!src || !obj) {
      this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
        type: 'warning',
        buttons: ['OK'],
        title: 'Ошибка',
        message: 'Произошла ошибка. Попробуйте еще раз.'
      });
      //console.log('event.ports:', event.ports);
      this.setWaiting('');
      return;
    }
    let newIdMap = {};
    let newData = obj.data;
    newData.forEach((item) => newIdMap[item.data.id] = this.conn.nextId())
    //console.log('import', newIdMap)
    newData.forEach((item) => {
      if (item.data.target && item.data.source) {
        item.data.target = newIdMap[item.data.target]
        item.data.source = newIdMap[item.data.source]
      }
      item.data.id = newIdMap[item.data.id]
      item.selected = false
      console.log(item)
    })
    this.cy.add(newData)

    if (obj.style) {
      let currentStyle = this.cy.style().json()
      for (let entry of obj.style) {
        //`[id = '${id}']`
        console.log(entry.selector)
        entry.selector = entry.selector.replace(/\[id = ['"]?([a-z\d]+)['"]?\]/g, (match, id) => {
          console.log(id, newIdMap[id])
          return `[id = '${newIdMap[id]}']`
        })
        currentStyle.push(entry)
      }
      console.log('import', currentStyle)
      this.cy.style().fromJson(currentStyle).update()
    }
    this.setWaiting('');
    this.switchDialog('');
  }

  /* ---------------------------------- Закрыть проект ------------------------------ */

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
    if (this.cy) {
      this.cy.destroy();
      this.conn.cy = null;
      this.cy = null;
    }
    if (callback) callback();
  }

  ngOnInit(): void {
    let params = this.getParams();
    let renderParams = ['data', 'zoom', 'pan'];
    for (let p in params) {
      if (!renderParams.includes(p)) this[p] = params[p]
    }
    this.activeToolId = 'pan_view';//prevent expression changed after checked in icon-button
    this.setWindowTitle();
    this.conn.change.subscribe( value => {
      this.unsavedChanges = value
    });

    this.ipcRenderer.on('has-unsaved-changes', this.hasUnsavedChangesListener);
    this.ipcRenderer.on('quit-request', this.quitRequestListener);
  }

  ngAfterViewInit(): void {
    let params = this.getParams();
    this.render(params.data, params.style, params.zoom, params.pan);
  }
}
