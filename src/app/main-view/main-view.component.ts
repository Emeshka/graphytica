import { Component, Input, ViewChild, NgZone, OnInit } from '@angular/core';
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
  importPath : string = '';
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
        console.log('remove tapstart', selector, listeners['tapstart'][selector], 'element id:', listeners.id)
        this.cy.removeListener('tapstart', selector, listeners['tapstart'][selector])
      }
      for (let listener of listeners.tapend) {
        console.log('remove tapend', listener, 'element id:', listeners.id)
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
          console.log('tapEnd:', evt, 'element id:', e.data('id'))
          if (moveBendPoint) {
            let angle = findAngle(evt.target.position(), e.source().position(), e.target().position())
            let AC = findDistance(evt.target.position(), e.source().position())
            /*console.log('positions: control:',
              evt.target.position(),
              ', edge source:',
              e.source().position(),
              ', edge target:',
              e.target().position(),
              '; angle=', angle, ', AC=', AC
            )*/
            let d = Math.floor(Math.sin(angle) * AC)
            let w = Math.cos(angle) * AC / findDistance(e.source().position(), e.target().position())
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
        ]);
      }

      let moveSourcePoint = false
      let sourceTapStart = (evt) => {
        moveSourcePoint = true
      }
      let sourceTapEnd = (evt) => {
        if (moveSourcePoint) {
          moveSourcePoint = false
          if (evt.target && evt.target != this.cy && evt.target.isNode() && !evt.target.data('id').startsWith('move-')) {
            console.log(evt.target)
            e.move({
              source: evt.target.data('id')
            });
            e.unselect()
            e.select()
          } else {
            this.conn.getById('move-source').position(e.sourceEndpoint())
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
      ]);

      let moveTargetPoint = false
      let targetTapStart = (evt) => {
        moveTargetPoint = true
      }
      let targetTapEnd = (evt) => {
        if (moveTargetPoint) {
          moveTargetPoint = false
          if (evt.target && evt.target != this.cy && evt.target.isNode() && !evt.target.data('id').startsWith('move-')) {
            console.log(evt.target)
            e.move({
              target: evt.target.data('id')
            });
            e.unselect()
            e.select()
          } else {
            this.conn.getById('move-target').position(e.targetEndpoint())
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
      ]);

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
      this.onClose(() => {
        this.reopenProject(this.dbLastSavedPath)
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
      newData.forEach((item) => newIdMap[item.data.id] = this.conn.nextId())
      newData.forEach((item) => {
        if (item.target && item.source) {
          item.target = newIdMap[item.target]
          item.source = newIdMap[item.source]
        }
        item.data.id = newIdMap[item.data.id]
        item.selected = false
      })
      this.cy.add(newData)
      for (let entry of obj.style) {
        //`[id = '${id}']`
        entry.selector.replace(/\[id = ([a-z\d]+)\]/g, (match, id) => {
          return `[id = '${newIdMap[id]}']`
        })
      }
      this.cy.style().fromJson(obj.style).update()
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
