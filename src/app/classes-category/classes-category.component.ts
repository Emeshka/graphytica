import { Component, OnInit, Input, ViewChildren } from '@angular/core';
import { DbServiceService } from '../db-service.service';
//import { CdkTextareaAutosize } from '@angular/cdk/text-field';

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
  /*@ViewChildren('vcSuperClass') vcSuperClass;
  @ViewChildren('vcAlterFieldName') vcAlterFieldName;
  @Input('cdkTextareaAutosize') enabled: boolean
  @Input('cdkAutosizeMaxRows') maxRows: number
  @Input('cdkAutosizeMinRows') minRows: number*/

  public selectedClass = '';

  countEntities = -1;
  countDirectEntities = -1;
  selectedDirectChildren = [];
  selectedFieldList = {};
  private selectedDescendantsSelector = '';

  fakeNewField = false;
  newFieldType = '';
  newFieldName = '';

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

    /*this.textareaFitContent(this.vcSuperClass.toArray()[0].nativeElement);
    let alterFields = this.vcAlterFieldName.toArray();
    for (let f of alterFields) {
      this.textareaFitContent(f.nativeElement)
    }*/
  }

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

  setNewFieldName(event) {
    let n = event.target.value
    n = this.cutForbidden(this.trim(n))
    if (this.isFieldNameInvalid(n)) {
      event.target.value = this.newFieldName
    } else {
      this.newFieldName = n
      if (this.newFieldType) this.createField();
    }
  }

  getSelectedClass() {
    return this.selectedClass;
  }

  ///////////////////////////////////////////////////////////////////

  alterField(propName, attr, newValue) {
    let params = {}
    params[attr] = newValue;
    this.conn.alterProperty(this.selectedClass, propName, params);
    //console.log(this.conn.classesMap[this.selectedClass].properties);
  }

  alterFieldName(oldPropName, event) {
    //console.log('alterFieldName', oldPropName, newPropName)
    let newPropName = event.target.value
    newPropName = newPropName.trim()
    var element = event.target || event.srcElement || event.currentTarget;
    if (this.isFieldNameInvalid(newPropName)) {
      element.value = oldPropName
    } else {
      this.conn.alterProperty(this.selectedClass, oldPropName, {name: newPropName})
      element.value = newPropName
    }
    this.clearModifiedInvalid(event)
    //console.log('alterFieldName', this.conn.classesMap)
  }

  alterSuperClass(event) {
    let newSuperClass = event.target.value
    newSuperClass = newSuperClass.trim()
    var element = event.target || event.srcElement || event.currentTarget;
    if (this.isNewSuperClassInvalid(newSuperClass)) {
      element.value = this.conn.classesMap[this.selectedClass].superClass
    } else {
      this.conn.alterClass(this.selectedClass, {superClass: newSuperClass})
      element.value = newSuperClass
    }
    this.clearModifiedInvalid(event)
  }

  ////////////////////////////////////////////////////////////////////

  isFieldNameColliding(propName, className) {
    let allProps = this.conn.getAllProps(className)
    if (propName in allProps) return true;
    let descendantsProps = this.conn.getClassWithDescendants(className).map(c => c.properties);
    descendantsProps = [].concat.apply([], descendantsProps);
    return propName in descendantsProps;
  }

  isFieldNameInvalid(propName) {
    //console.log(propName)
    propName = this.cutForbidden(this.trim(propName))
    let colliding = this.isFieldNameColliding(propName, this.selectedClass)
    return (propName == '' || propName.indexOf('\n') >= 0 || propName.indexOf('\r') >= 0 || colliding)
  }

  isNewSuperClassInvalid(newSuperClass) {
    //console.log(newSuperClass, newSuperClass == '' || !this.conn.classesMap[newSuperClass])
    newSuperClass = this.trim(newSuperClass)
    if (newSuperClass == '' || !this.conn.classesMap[newSuperClass]) return true;

    let namesArray = this.conn.getClassWithDescendants(this.selectedClass).map(c => c.name);
    if (namesArray.includes(newSuperClass)) return true;
    
    let thisProps = this.conn.classesMap[this.selectedClass].properties
    let colliding = false
    for (let p in thisProps) {
      colliding = colliding || this.isFieldNameColliding(p, newSuperClass)
    }
    return colliding
  }

  clearModifiedInvalid(event) {
    var element = event.target || event.srcElement || event.currentTarget;
    let parent = element.parentElement.parentElement;
    parent.className = parent.className.replace(/\s*invalid_input/g, '');
    parent.className = parent.className.replace(/\s*modified_input/g, '');
    //console.log('parent css class =', parent.className)
    //event.resizeToFitContent();
  }

  /*textareaFitContent(element) {
    element.style.height = "";
    let sh = element.scrollHeight;
    element.style.height = (sh + 20) + "px";
    console.log(element, sh);
  }*/

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
  
  checkInvalid(event, oldValue, trim, isInvalid) {
    var element = event.target || event.srcElement || event.currentTarget;
    let parent = element.parentElement.parentElement;

    if (element.value.endsWith('\n') || element.value.endsWith('\r')) {
      element.value = this.cutForbidden(element.value)
      if (trim) element.value = this.trim(element.value)
      element.dispatchEvent(new Event('change', { 'bubbles': true }))
      return;
    }
    element.value = this.cutForbidden(element.value)

    //console.log(oldValue, element.value, oldValue != element.value)
    if (trim) oldValue = this.trim(oldValue)
    let value = element.value
    if (trim) value = this.trim(value)

    if (oldValue != value) {
      if (isInvalid(value)) {
        //console.log('invalid')
        if (parent.className.indexOf('invalid_input') < 0) {
          if (parent.className.indexOf('modified_input') < 0) {
            parent.className += ' invalid_input';
          } else {
            parent.className = parent.className.replace(/\s*modified_input/g, ' invalid_input');
          }
        }
      } else {
        //console.log('modif')
        if (parent.className.indexOf('modified_input') < 0) {
          if (parent.className.indexOf('invalid_input') < 0) {
            parent.className += ' modified_input';
          } else {
            parent.className = parent.className.replace(/\s*invalid_input/g, ' modified_input');
          }
        }
      }
    } else {
      //console.log('remove')
      parent.className = parent.className.replace(/\s*invalid_input/g, '');
      parent.className = parent.className.replace(/\s*modified_input/g, '');
    }
    //console.log('parent css class =', parent.className, typeof parent.className, parent)
  }

  ngOnInit(): void {
  }
}
