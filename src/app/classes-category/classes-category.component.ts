import { Component, OnInit, Input } from '@angular/core';
import { DbServiceService } from '../db-service.service';

@Component({
  selector: 'app-classes-category',
  templateUrl: './classes-category.component.html',
  styleUrls: ['./classes-category.component.css']
})
export class ClassesCategoryComponent implements OnInit {
  constructor(
    public conn: DbServiceService
  ) { }
  @Input() selection: any = [];
  public selectedClass = '';
  countEntities = -1;
  countDirectEntities = -1;
  selectedDirectChildren = [];
  selectedFieldList = {};
  private selectedDescendantsSelector = '';

  fakeNewField = false;
  newFieldType = '';
  newFieldName = '';

  addToSelection = () => {
    let oldValue = this.conn.cy.autounselectify();
    this.conn.cy.autounselectify(false);
    this.conn.cy.$(this.selectedDescendantsSelector).select()
    this.conn.cy.autounselectify(oldValue);
  };

  excludeFromSelection = () => {
    let oldValue = this.conn.cy.autounselectify();
    this.conn.cy.autounselectify(false);
    this.conn.cy.$(this.selectedDescendantsSelector).unselect()
    this.conn.cy.autounselectify(oldValue);
  };

  addFakeField = () => {
    this.fakeNewField = true;
  }

  hideFakeField = () => {
    this.newFieldType = '';
    this.newFieldName = '';
    this.fakeNewField = false;
  }

  createField() {
    let propObj = {}
    propObj[this.newFieldName] = {
      type: this.newFieldType
    }
    this.conn.alterClass(this.selectedClass, {
      addProperties: propObj
    })
    this.hideFakeField();
  }

  setNewFieldType(t) {
    this.newFieldType = t;
    if (this.newFieldName) this.createField();
  }

  setNewFieldName(n) {
    this.newFieldName = n;
    if (this.newFieldType) this.createField();
  }

  alterField(propName, attr, newValue) {
    let params = {}
    params[attr] = newValue;
    this.conn.alterProperty(this.selectedClass, propName, params);
    console.log(this.conn.classesMap[this.selectedClass].properties);
  }

  selectClass = (value) => {
    console.log('selectClass()', value);

    if (value) {
      this.selectedFieldList = this.conn.classesMap[value].properties;
      this.selectedDirectChildren = this.conn.classesMap[value].children.map(cl => cl.name);

      this.countDirectEntities = this.conn.cy.$(`[_class = '${value}']`).length;
      let accum = this.conn.getClassWithDescendants(value).map(c => c.name);
      this.selectedDescendantsSelector = '[_class = "'+accum.join('"], [_class = "')+'"]';
      this.countEntities = this.conn.cy.$(this.selectedDescendantsSelector).length;
    }

    this.selectedClass = value || '';
  }

  ngOnInit(): void {
  }
}
