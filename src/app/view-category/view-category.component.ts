import { Component, OnInit, Input } from '@angular/core';
import { DbServiceService } from '../db-service.service';
import { SelectQuery } from '../selection-category/SelectQuery';

@Component({
  selector: 'view-category',
  templateUrl: './view-category.component.html',
  styleUrls: ['./view-category.component.css']
})
export class ViewCategoryComponent implements OnInit {

  constructor(
    private conn: DbServiceService
  ) { }

  @Input() cy = null;
  private static storedNewSettings = {
    fakeNewField: false,
    condition: new SelectQuery('SELECT nodes WHERE isSelected'),
    name: null,
    tempStrQuery: 'SELECT nodes WHERE isSelected',
    manualTyping: false,
    then: [
      {
        what: 'background-color',
        calculator: 'equals',
        value: null
      }
    ]
  };
  newSettings;
  rules = [];
  supportedStyles = ['background-color', 'width', 'height', 'line-color'];
  colorStyles = ['background-color', 'line-color'];
  isAddRuleButtonActive = false;

  autolayout() {
    let options = {
      name: 'cola',
      animate: true,
      refresh: 1,
      maxSimulationTime: 4000,
      ungrabifyWhileSimulating: false,
      fit: true,
      padding: 30,
      nodeDimensionsIncludeLabels: false,
      ready: function(){},
      stop: function(){},
      randomize: false,
      avoidOverlap: true,
      handleDisconnected: true,
      convergenceThreshold: 0.01,
      nodeSpacing: function( node ){ return 10; }
    }
    this.cy.layout(options).run();
    this.cy.layout({name: 'preset'}).run();
  }

  addFakeField = () => {
    this.newSettings.fakeNewField = true;
  }

  hideFakeField = () => {
    this.newSettings = {
      fakeNewField: false,
      condition: new SelectQuery('SELECT nodes WHERE isSelected'),
      tempStrQuery: 'SELECT nodes WHERE isSelected',
      manualTyping: false,
      name: null,
      then: [
        {
          what: 'background-color',
          calculator: 'equals',
          value: null
        }
      ]
    };

    ViewCategoryComponent.storedNewSettings = this.newSettings
    this.newSettings.fakeNewField = false;
  }

  createRule() {
    this.conn.addStyleRule({
      condition: this.newSettings.condition,
      name: this.newSettings.name,
      then: this.newSettings.then
    })
    this.hideFakeField();
  }

  isCytoscapeClassNameInvalid(name) {
    if (!name) return true;
    let isValid = /^[a-z][a-z0-9_-]*$/.test(name)
    return !isValid
  }

  isInvalidCSSProperty(name, value){
    var s = document.createElement('div').style;
    s[name] = value;
    return s[name] != value;
  }

  trim(string) {
    return string.trim().replace(/\s\s+/g, ' ')
  }

  cutForbidden(string) {
    string = string.replace(/[\n\r\t\0]/g, ' ')
    return string
  }
  
  checkInvalid(event, isInvalid) {
    var element = event.target || event.srcElement || event.currentTarget;
    
    if (element.value.includes('\n') || element.value.includes('\r')) {
      element.value = this.trim(this.cutForbidden(element.value))
      //element.dispatchEvent(new Event('change', { 'bubbles': true }))
      element.blur()
      //console.log('dispatched event')
      return;
    }
    element.value = this.cutForbidden(element.value)

    //console.log(oldValue, element.value, oldValue != element.value)
    let value = this.trim(element.value)

    if (isInvalid(value) && element.className.indexOf('invalid_input') < 0) {
      element.className += ' invalid_input';
    } else {
      element.className = element.className.replace(/\s*invalid_input/g, '');
    }
    //console.log('parent css class =', parent.className, typeof parent.className, parent)
  }

  setNewStyleRuleName(event) {
    //console.log(`setNewClassName `, event)
    if (!this.isCytoscapeClassNameInvalid(event.target.value)) {
      this.newSettings.name = event.target.value
  
      var element = event.target || event.srcElement || event.currentTarget;
      let parent = element.parentElement.parentElement;
      parent.className = parent.className.replace(/\s*invalid_input/g, '');
    }
    this.updateIsAddRuleButtonActive()
  }

  addThenStyle() {
    this.newSettings.then.push(
      {
        what: 'background-color',
        calculator: 'equals',
        value: null
      }
    )
    this.updateIsAddRuleButtonActive()
  }

  removeThenStyle() {
    //
  }

  setThenStyleName(index, name) {
    this.newSettings.then[index].what = name
    this.updateIsAddRuleButtonActive()
  }

  setThenStyleCalculator(index, calculator) {
    let oldCalculator = this.newSettings.then[index].calculator
    this.newSettings.then[index].calculator = calculator
    if ((oldCalculator == 'equals' || oldCalculator == 'data') && calculator == 'mapData') {
      this.newSettings.then[index].value = [this.newSettings.then[index].value, null, null, null, null]
    } else if ((calculator == 'equals' || calculator == 'data') && oldCalculator == 'mapData') {
      this.newSettings.then[index].value = this.newSettings.then[index].value[0]
    }
    this.updateIsAddRuleButtonActive()
  }

  setThenStyleValue(index, event) {
    let style = this.newSettings.then[index]
    console.log(index, this.newSettings)
    if (!this.isInvalidCSSProperty(style.what, event.target.value)) {
      style.value = event.target.value
  
      var element = event.target || event.srcElement || event.currentTarget;
      let parent = element.parentElement.parentElement;
      parent.className = parent.className.replace(/\s*invalid_input/g, '');

      if (this.colorStyles.includes(style.what)) {
        let testColorBlock = element.parentElement.previousSibling
        testColorBlock.style.background = event.target.value
      }
    }
    this.updateIsAddRuleButtonActive()
  }

  setThenStyleValueData(index, event) {
    let style = this.newSettings.then[index]
    style.value = event.target.value
  
    var element = event.target || event.srcElement || event.currentTarget;
    if (this.colorStyles.includes(style.what)) {
      let testColorBlock = element.parentElement.previousSibling
      testColorBlock.style.background = event.target.value
    }
    this.updateIsAddRuleButtonActive()
  }

  setThenStyleValueMapData(index, partIndex, event, isInvalid) {
    let style = this.newSettings.then[index]
    if (isInvalid == 'isNaN') isInvalid = isNaN.bind(this, event.target.value)
    if (partIndex == 0 || isInvalid && !isInvalid()) {
      style.value[partIndex] = event.target.value
  
      if (partIndex > 0) {
        var element = event.target || event.srcElement || event.currentTarget;
        let parent = element.parentElement.parentElement;
        parent.className = parent.className.replace(/\s*invalid_input/g, '');
        if (partIndex == 3 || partIndex == 4) {
          if (this.colorStyles.includes(style.what)) {
            let testColorBlock = element.parentElement.previousSibling
            testColorBlock.style.background = event.target.value
          }
        }
      }
    }
    this.updateIsAddRuleButtonActive()
  }

  removeStyleRule(rule) {
    this.conn.removeStyleRule(rule)
  }

  editQuery() {
    this.newSettings.manualTyping = !this.newSettings.manualTyping
  }

  setTempQuery(value) {
    this.newSettings.tempStrQuery = value
  }

  setQuery() {
    this.newSettings.condition = new SelectQuery(this.newSettings.tempStrQuery)
    this.newSettings.manualTyping = false
    this.updateIsAddRuleButtonActive()
  }

  updateIsAddRuleButtonActive() {
    let isSelectQuery = this.newSettings.condition instanceof SelectQuery
    let isSelector = this.newSettings.condition.tree.type == 'selector'
    let isNameValid = !this.isCytoscapeClassNameInvalid(this.newSettings.name)
    let isThenNotEmpty = this.newSettings.then.length > 0 && this.newSettings.then.every(
      style => {
        let what = style.what
        let calc = style.calculator
        let value = style.value
        let isString = typeof style.value == 'string'
        let isArray = style.value instanceof Array
        let notNull = isArray && style.value.every(v => !!v || v === 0)
        console.log('check then:', what, calc, value, isString, isArray, notNull)
        return what && calc && value && (isString || isArray && notNull)
      }
    )
    let result = isSelectQuery && isSelector && isNameValid && isThenNotEmpty
    console.log('update:', isSelectQuery, isSelector, isNameValid, isThenNotEmpty)
    this.isAddRuleButtonActive = result
  }

  ngOnInit(): void {
    this.rules = this.conn.styleRules
    this.newSettings = ViewCategoryComponent.storedNewSettings
  }
}
