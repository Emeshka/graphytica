import { Component, OnInit, Input, OnDestroy, SimpleChanges } from '@angular/core';
import { KeyValue } from '@angular/common';
import { DbServiceService } from '../db-service.service';

@Component({
  selector: 'edit-category',
  templateUrl: './vertices-category.component.html',
  styleUrls: ['./vertices-category.component.css']
})
export class VerticesCategoryComponent implements OnInit, OnDestroy {

  constructor(
    private conn: DbServiceService
  ) { }

  @Input() selection: any;
  @Input() setTool: (toolId) => {};
  @Input() isActiveTool;
  @Input() toolById;
  @Input() activeToolId: string;

  toolList = ['new_vertex', 'new_edge'];

  editSelected = null;

  entities = null;
  areEdges = false;
  classDefinedProps = null;
  commonClass = '';
  freeProps = null;

  propsOfNew = null;

  selectionListener = null;
  
  settingsOrderComparator = (a: KeyValue<string,any>, b: KeyValue<string,any>): number => {
    return a.value.order - b.value.order;
  }

  switchEditSelected(toolId) {
    if (toolId == 'new_vertex' || toolId == 'new_edge') {
      this.commonClass = this.toolById[toolId].settings['selectClass'].value;
      this.classDefinedProps = this.conn.getAllProps(this.commonClass);
      this.editSelected = false;
      this.propsOfNew = this.toolById[toolId].settings['newProps'].value
      if (!this.propsOfNew) {
        this.propsOfNew = {};
        for (let p in this.classDefinedProps) {
          this.propsOfNew[p] = '';
        }
        this.toolById[toolId].settings['newProps'].value = this.propsOfNew;
      }
      this.freeProps = {};
    } else {
      if (this.selectionListener) this.selectionListener();
      this.editSelected = true;
      //this.propsOfNew = {};
    }
    //console.log('switchEditSelected():', this.propsOfNew)
  }

  callSetTool(toolId) {
    this.setTool(toolId)
  }

  setSettingsValue(key, value) {
    if ((this.activeToolId == 'new_vertex' || this.activeToolId == 'new_edge') && key == 'selectClass') {
      this.commonClass = value;
      this.classDefinedProps = this.conn.getAllProps(value);
      this.propsOfNew = {};
      for (let p in this.classDefinedProps) {
        this.propsOfNew[p] = '';
      }
      this.toolById[this.activeToolId].settings['newProps'].value = this.propsOfNew;
    }
    this.toolById[this.activeToolId].settings[key].value = value
  }

  setPropOfNew(key, value, checkType) {
    //console.log(key, value, checkType)
    if (value === '') {
      this.propsOfNew[key] = '';
    } else {
      if (checkType == 'number') {
        let v = value*1
        if (!isNaN(v)) this.propsOfNew[key] = v;
      } else if (checkType == 'boolean') {
        if (typeof value == 'boolean') this.propsOfNew[key] = value;
      } else if (checkType == 'string') {
        this.propsOfNew[key] = value;
      }
    }
  }
        
  ngOnChanges(changes: SimpleChanges) {
    if (changes.activeToolId) {
      //console.log(changes)
      this.switchEditSelected(changes.activeToolId.currentValue);
    }
  }

  ngOnInit(): void {
    let f = () => {
      let arr = this.selection.getArray();
      let commonClass = '';
      let freeCommonProps = [];
      let areEdges = true;
      // if elements in selection share common class, we can show their fields
      for (let e of arr) {
        let className = e.data('_class');
        if (!commonClass) commonClass = className;
        else {
          let common = this.conn.getClosestCommonAncestor(commonClass, className)
          if (common) {
            commonClass = common
          } else {
            commonClass = '';
            break;
          }
        }

        let data = Object.keys(e.data())
        let eClassDefined = Object.keys(this.conn.getAllProps(className))
        let meta = ['_class', 'id']
        if (e.isEdge()) meta.push('target', 'source');
        else areEdges = false;
        let eFreeProps = []

        for (let d of data) {
          if (!meta.includes(d) && !eClassDefined.includes(d)) {
            eFreeProps.push(d)
          }
        }
        if (freeCommonProps.length > 0) {
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
      this.commonClass = commonClass;
      this.freeProps = freeCommonProps.length > 0 ? freeCommonProps : [];
      this.entities = arr.length > 0 ? arr.map(e => e.data()) : [];
      this.areEdges = areEdges;
      console.log('vertices-category.selectionListener():', this.entities, this.classDefinedProps, this.freeProps)
    }
    this.selectionListener = f.bind(this)
    this.selection.addEventListener('itemadded', this.selectionListener)
    this.selection.addEventListener('itemset', this.selectionListener)
    this.selection.addEventListener('itemremoved', this.selectionListener)

    this.switchEditSelected(this.activeToolId)

    /*console.log('vertices-category.ngOnInit():', this.activeToolId, this.isActiveTool('new_vertex'), this.editSelected,
      this.toolById[this.activeToolId].title, this.toolById[this.activeToolId].settings)*/
  }

  ngOnDestroy(): void {
    this.selection.removeEventListener('itemadded', this.selectionListener)
    this.selection.removeEventListener('itemset', this.selectionListener)
    this.selection.removeEventListener('itemremoved', this.selectionListener)
    this.selectionListener = null
  }
}
