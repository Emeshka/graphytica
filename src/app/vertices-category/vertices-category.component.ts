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
  @Input() toolById;
  @Input() activeToolId: string;

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
      this.editSelected = true;
    }
    //console.log('switchEditSelected():', this.propsOfNew)
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
    if (value === '' || value === null) {
      this.propsOfNew[key] = '';
    } else {
      if (checkType == 'number') {
        let v = value*1
        if (!isNaN(v)) this.propsOfNew[key] = v;
      } else if (checkType == 'boolean') {
        if (typeof value == 'boolean') this.propsOfNew[key] = value;
      } else if (checkType == 'string') {
        this.propsOfNew[key] = value;
      } else if (checkType == 'date' || checkType == 'time' || checkType == 'datetime') {
        this.propsOfNew[key] = value;
        //console.log(this.propsOfNew[key])
      }
    }
  }

  panToElement(id) {
    this.conn.cy.center(this.conn.getById(id))
  }
        
  ngOnChanges(changes: SimpleChanges) {
    if (changes.activeToolId) {
      this.switchEditSelected(changes.activeToolId.currentValue);
    }
  }

  ngOnInit(): void {
    this.switchEditSelected(this.activeToolId)
  }

  ngOnDestroy(): void {
  }
}
