import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { KeyValue } from '@angular/common';
import { ElectronService } from 'ngx-electron';
import { DbServiceService } from '../db-service.service';

@Component({
  selector: 'selection-category',
  templateUrl: './selection-category.component.html',
  styleUrls: ['./selection-category.component.css']
})
export class SelectionCategoryComponent implements OnInit, OnDestroy {

  constructor(
    private conn: DbServiceService,
    private _electronService: ElectronService
  ) { }

  @Input() selection: any;
  @Input() toolById;
  @Input() activeToolId: string;

  showBasicTable = true;
  expandTable = false;
  selectionListener = null;
  showCreateFreeField = false;

  entities = null;
  areEdges = null;
  commonClass = '';

  classDefinedProps = null;
  freeProps = null;
  unifyFreeProps = null;
  classDefinedPropsColspanOwnerByOrder = null;
  
  static hideColumnsList = [];
  get hideColumns() {
    return SelectionCategoryComponent.hideColumnsList;
  }
  set hideColumns(newHideColumnsList) {
    SelectionCategoryComponent.hideColumnsList = newHideColumnsList;
  }
  
  classPropsOrderComparator = (a: KeyValue<string,any>, b: KeyValue<string,any>): number => {
    let owners = a.value.owner.localeCompare(b.value.owner)
    if (owners != 0) return owners;
    return a.key.localeCompare(b.key)
  }

  updateTable() {
    if (this.selectionListener) this.selectionListener();
    this.showBasicTable = true;
  }

  panToElement(id) {
    this.conn.cy.center(this.conn.getById(id))
  }

  // Выключать столбцы
  toggleColumn(propName) {
    let list = this.hideColumns
    let index = list.indexOf(propName)
    if (index >= 0) {
      list.splice(index, 1)
    } else {
      list.push(propName)
    }
    this.hideColumns = list
  }

  resetHideColumn() {
    this.hideColumns = []
  }

  toggleExpand() {
    this.expandTable = !this.expandTable
  }

  deleteFree(propName) {
    const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
      type: 'question',
      buttons: ['No', 'Yes'],
      title: 'Удалить свободное свойство',
      message: `Вы уверены, что хотите безвозвратно удалить свободное свойство ${propName} у выделенных элементов?`
    });
    if (choice === 1) {
      this.selection.getArray().forEach((e) => e.removeData(propName))
      let index = this.freeProps.indexOf(propName)
      if (index >= 0) {
        this.freeProps.splice(index, 1)
      }
    }
  }

  /* --------------------------------------- Создание свободного свойства -------------------------- */

  toggleFakeField() {
    this.showCreateFreeField = !this.showCreateFreeField
  }

  hasForbidden(propOrClassName) {
    let forbidden = ['\n', '\t', '\r', '\0']
    let hasForbidden = forbidden.reduce((accum, current) => {
      return accum && propOrClassName.indexOf(current) >= 0
    }, true)
    return hasForbidden
  }

  isFieldNameColliding(propName, className) {
    let allProps = this.conn.getAllProps(className)
    if (propName in allProps) return true;
    let descendantsProps = this.conn.getClassWithDescendants(className).map(c => c.properties);
    descendantsProps = [].concat.apply([], descendantsProps);
    return propName in descendantsProps;
  }

  trim(string) {
    return string.trim().replace(/\s\s+/g, ' ')
  }

  cutForbidden(string) {
    string = string.replace('\n', ' ')
    string = string.replace('\r', ' ')
    string = string.replace('\t', ' ')
    string = string.replace('\0', '')
    return string
  }

  isFieldNameInvalid(propName) {
    propName = this.cutForbidden(this.trim(propName))
    let hasForbidden = this.hasForbidden(propName)
    let commonForbidden = propName == 'id' || propName == '_class' || propName == 'parent'
    let edgesForbidden = this.areEdges && (propName == 'source' || propName == 'target')
    if (!propName || hasForbidden || commonForbidden || edgesForbidden) return true;
    let colliding = this.isFieldNameColliding(propName, this.commonClass)
    if (colliding) return true;
    return this.unifyFreeProps.has(propName);
  }
  
  checkNewFreePropName(event) {
    var element = event.target || event.srcElement || event.currentTarget;
    
    if (element.value.includes('\n') || element.value.includes('\r')) {
      element.value = this.trim(this.cutForbidden(element.value))
      console.log('checkNewFreePropName dispatch change element', element)
      //element.dispatchEvent(new Event('change', { 'bubbles': true }))
      element.blur()
      return;
    }
    element.value = this.cutForbidden(element.value)

    let value = this.trim(element.value)

    if (this.isFieldNameInvalid(value) && element.className.indexOf('invalid_input') < 0) {
      element.className += ' invalid_input';
    } else {
      element.className = element.className.replace(/\s*invalid_input/g, '');
    }
  }

  setNewFreePropName(event) {
    console.log('setNewFreePropName', event)
    if (!this.isFieldNameInvalid(event.target.value)) {
      console.log('setNewFreePropName: name valid')
      this.selection.getArray().forEach((e) => e.data(event.target.value, ''))
      this.freeProps.push(event.target.value)
      this.showCreateFreeField = false;
  
      var element = event.target || event.srcElement || event.currentTarget;
      let parent = element.parentElement.parentElement;
      parent.className = parent.className.replace(/\s*invalid_input/g, '');
    }
  }
  
  /* ----------------------------------------- Инициализация ------------------------------------ */

  ngOnInit(): void {
    setTimeout(() => {

      let f = () => {
        let arr = this.selection.getArray();
        let commonClass = '';
        let freeCommonProps = null;
        let areEdges = true;
        let areVertices = true;
        this.unifyFreeProps = new Set([]);
        
        for (let e of arr) {
          console.log(e.data('id'), e.isNode(), e.isEdge())
          areEdges = areEdges && e.isEdge();
          areVertices = areVertices && e.isNode();
  
          let className = e.data('_class');
          if (!commonClass) commonClass = className;
          else {
            let common = this.conn.getClosestCommonAncestor(commonClass, className)
            if (common) {
              commonClass = common
            } else {
              commonClass = '';
            }
          }

          let meta = ['_class', 'id', 'parent']
          if (e.isEdge()) {
            meta.push('target', 'source');
          }
          let eClassDefined = Object.keys(this.conn.getAllProps(className))
          let data = Object.keys(e.data())
          let eFreeProps = []
          for (let d of data) {
            if (!meta.includes(d) && !eClassDefined.includes(d)) {
              if (e.data(d) !== null && e.data(d) !== undefined) {
                eFreeProps.push(d)
                this.unifyFreeProps.add(d)
              }
            }
          }
          if (freeCommonProps) {
            let i = 0
            while (i < freeCommonProps.length) {
              let f = freeCommonProps[i]
              if (!eFreeProps.includes(f)) {
                freeCommonProps.splice(i, 1)
              } else i++;
            }
          } else {
            freeCommonProps = eFreeProps
          }
        }

        this.classDefinedProps = commonClass ? this.conn.getAllProps(commonClass) : {};
        let ownerByOrder = []
        for (let p in this.classDefinedProps) {
          let owner = this.classDefinedProps[p].owner
          let obj = ownerByOrder.find(o => o.owner == owner)
          let index = ownerByOrder.indexOf(obj)
          if (index >= 0) {
            ownerByOrder[index].colspan++
          } else {
            ownerByOrder.push({
              owner: owner,
              colspan: 1
            })
          }
        }
        ownerByOrder.sort((a, b) => {
          return a.owner.localeCompare(b.owner)
        })
        this.classDefinedPropsColspanOwnerByOrder = ownerByOrder

        this.commonClass = commonClass;
        this.freeProps = (freeCommonProps && freeCommonProps.length > 0) ? freeCommonProps.sort((a,b) => {
          return a.localeCompare(b)
        }) : [];

        this.entities = arr.length > 0 ? arr.map(e => {
          let data = e.data()
          if (e.isEdge()) {
            data.source = e.source().data('id')
            data.target = e.target().data('id')
          }
          return data
        }).sort((a, b) => {
          return a.id.localeCompare(b.id)
        }) : [];

        if (this.entities.length == 0) {
          this.areEdges = null
        } else {
          this.areEdges = areEdges ? true : (areVertices ? false : null);
        }
        console.log(areEdges, areVertices, this.areEdges)
        console.log('selection-category.selectionListener():', this.entities)
      }
      this.selectionListener = f.bind(this)
      this.selection.addEventListener('itemadded', this.selectionListener)
      this.selection.addEventListener('itemset', this.selectionListener)
      this.selection.addEventListener('itemremoved', this.selectionListener)
  
      this.updateTable()

    })
  }

  ngOnDestroy(): void {
    this.selection.removeEventListener('itemadded', this.selectionListener)
    this.selection.removeEventListener('itemset', this.selectionListener)
    this.selection.removeEventListener('itemremoved', this.selectionListener)
    this.selectionListener = null
  }
}
