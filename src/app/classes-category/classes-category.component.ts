import { Component, OnInit, Input, ViewChildren } from '@angular/core';
import { DbServiceService } from '../db-service.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-classes-category',
  templateUrl: './classes-category.component.html',
  styleUrls: ['./classes-category.component.css']
})
export class ClassesCategoryComponent implements OnInit {
  constructor(
    public conn: DbServiceService,
    private _electronService: ElectronService
  ) { }
  @Input() selection: any = [];

  public selectedClass = '';
  public isEdge = false;

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

      this.countDirectEntities = this.conn.getDirectInstances(value).length;
      this.countEntities = this.conn.getAllInstances(value).length;
      let superStack = this.conn.getSuperStack(value).map(c => c.name);
      this.isEdge = superStack.includes('E')
    }

    this.selectedClass = value || '';
  }
/*
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
*/
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

  removeField(propName) {
    const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
      type: 'question',
      buttons: ['Cancel', 'Удалить также и данные (необратимо)', 'Только убрать из модели'],
      title: 'Удалить поле',
      message: `Экземпляры класса "${this.selectedClass}" могут иметь установленные значения
в поле "${propName}". Вы хотите только убрать поле "${propName}" из модели класса
(данные останутся и станут свободными свойствами) или также безвозвратно стереть значения поля?`
    });
    console.log(choice);
    if (choice === 1 || choice === 2) {
      this.conn.alterClass(this.selectedClass, {removeProperties: [propName]})
      if (choice === 1) {
        let classInstances = this.conn.getAllInstances(this.selectedClass);
        classInstances.removeData(propName);
      }
    }
  }

  ////////////////////////////////////////////////////////////////////

  isFieldNameColliding(propName, className) {
    let allProps = this.conn.getAllProps(className)
    if (propName in allProps) return true;
    let descendantsProps = this.conn.getClassWithDescendants(className).map(c => c.properties);
    descendantsProps = [].concat.apply([], descendantsProps);
    return propName in descendantsProps;
  }

  hasForbidden(propOrClassName) {
    /*let forbidden = ['\n', '\t', '\r', '\0']
    let hasForbidden = forbidden.reduce((accum, current) => {
      return accum && propOrClassName.indexOf(current) >= 0
    }, true)
    return hasForbidden*/
    return propOrClassName.search(/[\n\t\r\0]/g) >= 0
  }

  isFieldNameInvalid(propName) {
    //console.log(propName)
    propName = this.cutForbidden(this.trim(propName))
    let hasForbidden = this.hasForbidden(propName)
    let commonForbidden = propName == 'id' || propName == 'class' || propName == 'parent'
    let edgesForbidden = this.isEdge && (propName == 'source' || propName == 'target')
    if (!propName || hasForbidden || commonForbidden || edgesForbidden) return true;
    let colliding = this.isFieldNameColliding(propName, this.selectedClass)
    return colliding;
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
  }

  trim(string) {
    return string.trim().replace(/\s\s+/g, ' ')
  }

  cutForbidden(string) {
    string = string.replace(/[\n\r\t\0]/g, ' ')
    return string
  }
  
  checkInvalid(event, oldValue, trim, isInvalid) {
    var element = event.target || event.srcElement || event.currentTarget;
    let parent = element.parentElement.parentElement;

    if (element.value.includes('\n') || element.value.includes('\r')) {
      element.value = this.cutForbidden(element.value)
      if (trim) element.value = this.trim(element.value)
      //element.dispatchEvent(new Event('change', { 'bubbles': true }))
      element.blur()
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
