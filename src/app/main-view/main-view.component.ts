import { Component, Input, ViewChild, NgZone } from '@angular/core';

import { ElectronService } from 'ngx-electron';
//import { LastDirectoryService } from '../last-directory.service';
import { DbServiceService } from '../db-service.service';
import { UpdateRecentService } from '../update-recent.service';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css']
})
export class MainViewComponent {
  /* ---------------------------------------------------- private --------------------------------------------------- */
  constructor(
    private _electronService: ElectronService,
    //private _lastDirectoryService: LastDirectoryService,
    private _updateRecentService: UpdateRecentService,
    private conn: DbServiceService,
    private _nz: NgZone) { }

  private fs = this._electronService.remote.require('fs');
  private path = this._electronService.remote.require('path');
  private ipcRenderer = this._electronService.ipcRenderer;
  //private cytoscape = this._electronService.remote.require('cytoscape');
  private cy;

  private _dbLastSavedPath : string;
  public set dbLastSavedPath(val: any) {
    this._dbLastSavedPath = val;
    this.setWindowTitle();
  }
  public get dbLastSavedPath(): any {
    return this._dbLastSavedPath;
  }
  private dbOpenedWithFormat : string;
  private batchBuildCopy : string = '';
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
    this.onClose(true, () => {
      //console.log('renderer main-view: onClose finished');
      this.ipcRenderer.send('quit-request', true);
    });
  };
  private importSuccessListener = (event,params) => {
    console.log('main-view received import-success =', params);
    this._nz.run(() => {
      this.switchDialog('');
      let p = JSON.parse(params).src;
      this._updateRecentService.updateRecentProjects(p);
      if (p == this.dbLastSavedPath) this.unsavedChanges = false;
      else this.unsavedChanges = true;

      if (this.batchBuildCopy) {
        this.setWaiting('Слияние проектов...');
        this.conn.pool.acquire().then(session => {
          session.batch(this.batchBuildCopy).all().then(() => {
            this.batchBuildCopy = '';
            this.setWaiting('');
            this.render();
          })
        }).catch(e => console.log(e));
      } else {
        this.setWaiting('');
        this.render();
      }
    });
  }
  private exportSuccessListener = (event,params) => {
    console.log('main-view received export-success =', params);
    let obj = JSON.parse(params);
    let exportedPath = obj.src;
    this._updateRecentService.updateRecentProjects(exportedPath);
    this._nz.run(() => {
      if (exportedPath) {
        this.unsavedChanges = false;
        this.dbLastSavedPath = exportedPath;
        this.dbOpenedWithFormat = obj.format;

        let extIndex = exportedPath.lastIndexOf('.export.gz');
        if (extIndex < 0) {
          extIndex = exportedPath.lastIndexOf('.gz');
          if (extIndex < 0) extIndex = exportedPath.length;
        }
        this.dbName = exportedPath.substring(exportedPath.lastIndexOf(this.path.sep)+1, extIndex);
        this.setWaiting('');
      }
    });
  }
  
  /* ---------------------------------------------------- Input, ViewChild --------------------------------------------------- */

  @Input() getParams: any;
  @Input() backToStartView: () => {};
  @Input() setWaiting: (text) => {};
  @Input() reopenProject = (projectPath, format) => {};
  @ViewChild('graph_field') graphField;
  @ViewChild('importGraphTypeTag') importGraphTypeTag;

  /* ---------------------------------------------------- public --------------------------------------------------- */

  // диалоги и вуаль во время загрузки
  mainDialog : string = '';
  importPath : string = '';
  saveAsPath : string = '';

  // данные
  //обратить внимание, что V - это класс, по умолчанию присвоенный всем вершинам, а E - всем ребрам, и им можно наследовать при создании класса
  readonly servicePrecreatedClasses = ["OMultiLineString", "OFunction", "OShape", "OUser", "OPoint", "OMultiPolygon",
    "ORestricted", "OTriggered", "OLineString", "OSecurityPolicy", "OSchedule", "OSequence", "ORectangle", "OIdentity",
    "OPolygon", "OMultiPoint", "OGeometryCollection", "ORole"];
  userDefinedClasses = [];
  
  private selectionNodes = [];
  private selectionEdges = [];

  // инструменты, выделение
  openedCategory : string = 'file';
  isRendering : boolean = true;
  graphClickListener = () => {};//активный инструмент: что делать по клику на cy
  zoomStep = 0.3;
  readonly toolById = {
    select_move_any: {
      icon: 'assets/img/select.png',
      title: 'Действие мыши: выделение и перемещение элементов',
      appliableTo: 'node, edge',//cytoscape selector
      oninit: () => {
        this.cy.autoungrabify(false);
        this.cy.autounselectify(false);
        this.cy.userPanningEnabled(false);
        //this.setElementEvents(true);
      }/*,
      onclick: (evt) => {
        var elem = evt.target;
        console.log( 'tapped ' + elem.id() );
        this._nz.run(() => {
          if (elem.source) this.selectionE = [elem];
          else this.selectionV = [elem];
        })
      }*/
    },
    pan_view: {
      icon: 'assets/img/grab.png',
      title: 'Действие мыши: перемещение поля зрения',
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
        //this.setElementEvents(false);
      }
    },
    zoom_in: {
      icon: 'assets/img/zoom_in.png',
      title: 'Увеличить масштаб',
      oninit: () => {
        this.cy.autoungrabify(true);
        this.cy.autounselectify(true);
        this.cy.userPanningEnabled(true);
        //this.setElementEvents(false);
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
        //this.setElementEvents(false);
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
        //this.setElementEvents(false);
      },
      onclick: (evt) => {
        this.cy.zoom({
          level: 1,
          renderedPosition: evt.renderedPosition
        });
      }
    }
  };
  readonly controlsToolList = ['zoom_out', 'zoom_in', 'zoom_auto', 'select_move_any', 'pan_view'];
  activeToolId = '';

  /* ---------------------------------------------------- public functions --------------------------------------------------- */

  /*setElementEvents = function(value) {
    let testNode = null;
    if (value) {
      /*this.cy.$('node, edge').forEach(node => {
        node.style('events', 'yes');
        testNode = node;
        if (testNode) console.log(`node style length: `, testNode.style());
      })
    } else {
      /*this.cy.$('node, edge').forEach(node => {
        node.style('events', 'no');
        testNode = node;
        if (testNode) console.log(`node style length: `, testNode.style());
      });
    }
  }*/

  getData = () => {
    return new Promise((resolve, reject) => {
      //TEST
      /*this.conn.db.class.create('dfdfdf_VertexClass', 'V').then(()=>{
        this.conn.db.class.create('aaa_EdgeClass', 'E').then(() => {
          this.conn.db.create('VERTEX', 'V').one();
          this.conn.db.create('VERTEX', 'dfdfdf_VertexClass').one();

          let batch = `begin;
              let $v1 = create vertex dfdfdf_VertexClass set name = "вершина 1";
              let $v2 = create vertex dfdfdf_VertexClass set name = "вершина 2";
              let $v3 = create vertex dfdfdf_VertexClass set name = "вершина 3";
              let $v4 = create vertex dfdfdf_VertexClass set name = "вершина 4";
              let $e1 = create edge aaa_EdgeClass from $v1 to $v2;
              let $e2 = create edge aaa_EdgeClass from $v2 to $v3;
              let $e3 = create edge aaa_EdgeClass from $v3 to $v4;
              let $e4 = create edge aaa_EdgeClass from $v4 to $v1;
              commit;
              return $e1;`;

          this.pool.acquire().then(session => {
            session.batch(batch).all().then(results => {
              console.log(results);
            }).catch(e => reject(e));
          }).catch(e => reject(e));
        }).catch(e => reject(e));
      }).catch(e => reject(e));*/

      this.conn.db.class.list().then(classes => {
        // определить все кастомные классы
        this.userDefinedClasses = classes.filter(cl => !this.servicePrecreatedClasses.includes(cl.name));
        //console.log(this.userDefinedClasses);

        this.conn.db.query('SELECT * FROM V').then(allVertices => {
          //console.log('SELECT * FROM V', allVertices);
          this.conn.db.query('SELECT * FROM E').then(allEdges => {
            //console.log('SELECT * FROM E', allEdges);

            // конвертация в формат понятный cytoscape
            let convertedV = allVertices.map(this.conn.odbRecordToCytoscapeElement('node'));
            let convertedE = allEdges.map(this.conn.odbRecordToCytoscapeElement('edge'));
            let storedData = convertedV.concat(convertedE);
            console.log('Project storedData:', storedData);
            resolve(storedData);
          }).catch(e => reject(e));
        }).catch(e => reject(e));
      }).catch(e => reject(e));
    })
  }

  //https://stackoverflow.com/questions/10014271/generate-random-color-distinguishable-to-humans
  selectColor = function(number) {
    const hue = number * 137.508; // use golden angle approximation
    return `hsl(${hue},50%,75%)`;
  }

  //сейчас можно только один слушатель события одновременно, неважно на какой селектор
  setTool = (toolId) => {
    console.log(`active tool: ${toolId}`)
    if (this.activeToolId) {
      this.cy.removeListener('tap');
      this.cy.removeListener('tapdrag');
      this.cy.removeListener('mouseover');
      this.cy.removeListener('mouseout');
      this.cy.autoungrabify(true);
      this.cy.userPanningEnabled(true);
    }
    if (!toolId || this.toolById[toolId]) this.activeToolId = toolId;
    else {
      console.log(`Warning: tried to set unknown tool '${toolId}'`);
      return;
    }

    if (toolId) {
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
            //console.log(`cursor: ${this.graphField.nativeElement.style.cursor}`);
            //this.graphField.nativeElement.style.cursor = `pointer`;
            //this.graphField.nativeElement.style.cursor = `url('${this.toolById[this.activeToolId].icon}')`;
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
            //console.log(`cursor: ${this.graphField.nativeElement.style.cursor}`);
            //this.graphField.nativeElement.style.cursor = `pointer`;
            //this.graphField.nativeElement.style.cursor = `url('${this.toolById[this.activeToolId].icon}')`;
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
    }
  }

  isActiveTool = (id) => {
    return this.activeToolId == id;
  }

  // полный ререндер. вызывать только в случае импорта, sql запроса или другого изменения графа не через cytoscape
  render = () => {
    this.isRendering = true;
    this.getData().then(data => {
      this.cy = cytoscape({
        container: this.graphField.nativeElement, // container to render in
        elements: data,
        style: [ // the stylesheet for the graph
          {
            selector: 'node',
            style: {
              'background-color': '#7878ff',
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
              'background-color': '#a0a0ff',
              'border-width': '2px',
              'border-style': 'solid',
              'border-color': '#ddddff',
              'line-color': '#aa0000',
              'target-arrow-color': '#aa0000',
              'source-arrow-color': '#aa0000'
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
        layout: {// default layout options
          animate: true, // whether to show the layout as it's running
          refresh: 1, // number of ticks per frame; higher is faster but more jerky
          maxSimulationTime: 4000, // max length in ms to run the layout
          ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
          fit: true, // on every layout reposition of nodes, fit the viewport
          padding: 30, // padding around the simulation
          boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
          nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
        
          // layout event callbacks
          ready: function(){}, // on layoutready
          stop: function(){}, // on layoutstop
        
          // positioning options
          randomize: false, // use random node positions at beginning of layout
          avoidOverlap: true, // if true, prevents overlap of node bounding boxes
          handleDisconnected: true, // if true, avoids disconnected components from overlapping
          convergenceThreshold: 0.01, // when the alpha value (system energy) falls below this value, the layout stops
          nodeSpacing: function( node ){ return 10; }, // extra spacing around nodes
          flow: undefined, // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
          alignment: undefined, // relative alignment constraints on nodes, e.g. {vertical: [[{node: node1, offset: 0}, {node: node2, offset: 5}]], horizontal: [[{node: node3}, {node: node4}], [{node: node5}, {node: node6}]]}
          gapInequalities: undefined, // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
        
          // different methods of specifying edge length
          // each can be a constant numerical value or a function like `function( edge ){ return 2; }`
          edgeLength: undefined, // sets edge length directly in simulation
          edgeSymDiffLength: undefined, // symmetric diff edge length in simulation
          edgeJaccardLength: undefined, // jaccard edge length in simulation
        
          // iterations of cola algorithm; uses default values on undefined
          unconstrIter: undefined, // unconstrained initial layout iterations
          userConstIter: undefined, // initial layout iterations with user-specified constraints
          allConstIter: undefined, // initial layout iterations with all constraints including non-overlap
        },
        userZoomingEnabled: false,

        userPanningEnabled: true,
        autoungrabify: true,
        autounselectify: true
      });

      // мониторинг выделения
      // восстановление после импорта и перестройки cy
      for (let i = 0; i<this.selectionNodes.length; i++) {
        this.cy.$('#'+this.selectionNodes[i].id)?.select();
      }
      for (let i = 0; i<this.selectionEdges.length; i++) {
        this.cy.$('#'+this.selectionEdges[i].id)?.select();
      }
      //this.setElementEvents(true);

      // обновление выделения. оно же следит и за изменением выделения категориями вершин и ребер, т.к.они там вручную вызывают eles.select()
      let selectionNodesUpdate = () => {//пустой map - преобразование в массив
        this.selectionNodes = this.cy.$(':selected').filter(e => e.isNode());
        console.log('this.selectionNodes: ', this.selectionNodes, this.selectionNodes instanceof Array);
      };
      let selectionEdgesUpdate = () => {
        this.selectionEdges = this.cy.$(':selected').filter(e => e.isEdge());
        console.log('this.selectionEdges: ', this.selectionEdges, this.selectionEdges instanceof Array);
      }
      this.cy.nodes().on('select', selectionNodesUpdate)
      this.cy.edges().on('select', selectionEdgesUpdate)
      this.cy.nodes().on('unselect', selectionNodesUpdate)
      this.cy.edges().on('unselect', selectionEdgesUpdate)
      this.cy.nodes().on('remove', selectionNodesUpdate)
      this.cy.edges().on('remove', selectionEdgesUpdate)
      
      this.isRendering = false;
      this.setTool('pan_view');
    })
  }

  // переключатель категорий на панели инструментов
  switchCategory = (newCategory) => {
    this.openedCategory = newCategory;
  }

  /*------------------------------------ Управление --------------------------------------- */

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
      this.setWaiting('Закрытие проекта...');
      this.onClose(false, () => {
        this.reopenProject(this.dbLastSavedPath, this.dbOpenedWithFormat)
      });
    }
  }

  // сохранить
  saveProjectListener = () => {
    this.setWaiting('Сохранение проекта...');
    this._electronService.ipcRenderer.send('export-database', this.dbLastSavedPath);
  }

  saveDisabled = () => {
    return !this.unsavedChanges;
  }

  // сохранить как
  saveAsProjectListener = (fp) => {
    this.setWaiting('Сохранение проекта...');
    let p = fp + '.export.gz';
    if (this.fs.existsSync(p)) {
      if (this.fs.lstatSync(this.importPath).isFile()) {
        const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
          type: 'question',
          buttons: ['No', 'Yes'],
          title: 'Папка существует!',
          message: 'Одноименная папка уже существует по этому пути. Вы уверены, что хотите удалить ее и сохранить файл вместо нее?'
        });
        if (choice === 1) {
          this.fs.rmdir(p, { recursive: true }, () => {
            this._electronService.ipcRenderer.send('export-database', p);
          });
        }
      } else {
        const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
          type: 'question',
          buttons: ['No', 'Yes'],
          title: 'Файл существует!',
          message: 'Вы уверены, что хотите заменить существующий файл?'
        });
        if (choice === 1) {
          this.fs.unlink(p, () => {
            this._electronService.ipcRenderer.send('export-database', p);
          })
        }
      }
    } else this._electronService.ipcRenderer.send('export-database', p);
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
    if (this.userDefinedClasses.length > 2) {
      this.batchBuildCopy = this.userDefinedClasses.reduce((accum, el) => {
        if (el.name == 'V' || el.name == 'E') return accum;

        let com = `create class ${el.name} extends ${el.superClass};\n`;
        //TODO grab properties
        return accum + com;
      }, this.batchBuildCopy)
    }
    if (this.cy.elements().length > 0) {
      this.batchBuildCopy += 'begin;\n';

      let varNameByRid = {}; let vertexCount = 0;
      let storedData = this.cy.elements().map(e => e);

      this.batchBuildCopy = storedData.reduce((accum, el) => {
        let com = '';
        if (el.data.target && el.data.source) {
          let fromVar = varNameByRid[el.data.source];
          let toVar = varNameByRid[el.data.target];
          com = `create edge ${el.data['@class']} from ${fromVar} to ${toVar}`;
        } else {
          varNameByRid[el.data.id] = '$v'+vertexCount;
          com = `let ${varNameByRid[el.data.id]} = create vertex ${el.data['@class']}`;
          vertexCount++;
        }
        let setArray = [];
        let userClassesNames = this.userDefinedClasses.map(e => e.name);
        for (let p in el.data) {
          if (p == 'source' || p == 'target' || p == 'id' || p == '@class') continue;
          if (p.startsWith('in_') && userClassesNames.includes(p.substring(3))) continue;
          if (p.startsWith('out_') && userClassesNames.includes(p.substring(4))) continue;

          let val = (typeof el.data[p] == 'string') ? `"${el.data[p]}"` : el.data[p];
          setArray.push(`${p} = ${val}`);
        }
        if (setArray.length > 0) com += ' set '+setArray.join(', ');
        return accum + com + ';\n';
      }, this.batchBuildCopy)

      this.batchBuildCopy += 'commit;\n';
    }
    //console.log(this.batchBuildCopy);

    this.setWaiting('Закрытие соединения...');
    this.onClose(false, () => {
      let connect = this.conn.getConnectionPromise(this.setWaiting);
      connect.then(() => {
        this.setWaiting('Импорт...');
        let params = {
          src: this.importPath,
          format: this.importGraphTypeTag.nativeElement.value
        }
        this._electronService.ipcRenderer.send('import-database', JSON.stringify(params));
        //console.log('importMerge(): sent import-database request');
      });
    })
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
      this.onClose(true, () => {
        this.backToStartView();
        this.setWaiting('');
      });
    }
  }

  /* ---------------------------------- Инициализация, финализация ------------------------------ */

  // закрытие всех соединений и удаление слушателей IPC
  private onClose = (leaving, callback) => {
    if (this.conn.pool) this.conn.pool.close();
    this.conn.pool = null;
    if (this.conn.db) this.conn.db.close();
    this.conn.db = null;
    if (this.conn.server) this.conn.server.close();
    this.conn.server = null;

    let removeListeners = () => {
      if (leaving) {
        this.ipcRenderer.removeListener('has-unsaved-changes', this.hasUnsavedChangesListener);
        this.ipcRenderer.removeListener('quit-request', this.quitRequestListener);
        this.ipcRenderer.removeListener('import-success', this.importSuccessListener);
        this.ipcRenderer.removeListener('export-success', this.exportSuccessListener);
      }
    }
    if (this.conn.client) {
      this.conn.client.dropDatabase({
        name: 'tempdb',
        username: 'root',
        password: 'root'
      }).then(() => {
        this.conn.client.close();
        this.conn.client = null;
        //console.log('Graphytica INFO: Temp database dropped');
        
        removeListeners();
        if (callback) callback();
      }).catch(e => {console.log('Graphytica ERROR: Failed to drop temp DB.\n'+e)});
    } else {
      removeListeners();
      if (callback) callback();
    }
  }

  ngAfterViewInit(): void {
    let params = this.getParams();
    for (let p in params) {
      this[p] = params[p]
    }
    this.setWindowTitle();

    this.ipcRenderer.on('has-unsaved-changes', this.hasUnsavedChangesListener);
    this.ipcRenderer.on('quit-request', this.quitRequestListener);
    this.ipcRenderer.on('import-success', this.importSuccessListener);
    this.ipcRenderer.on('export-success', this.exportSuccessListener);

    this.conn.db.open().then(() => {
      this.render();
    });
  }
}
