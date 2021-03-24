import { Component, Input, OnInit } from '@angular/core';
import { DbServiceService } from '../db-service.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'tree-branch',
  templateUrl: './tree-branch.component.html',
  styleUrls: ['./tree-branch.component.css']
})
export class TreeBranchComponent implements OnInit {

  constructor(
    private conn: DbServiceService,
    private _electronService: ElectronService,
  ) { }
  @Input() tree: any = null;
  @Input() level: number = 0;
  @Input() selectElement = (className) => {};
  @Input() getSelectedClass = () => {};
  newSubclassSuper = '';
  fakeEditableChild = false;

  newSubclass(superClass) {
    //console.log(`TreeBranch newSubclass('${superClass}')`);
    this.newSubclassSuper = superClass;
    this.fakeEditableChild = true;
  }

  removeClass(name) {
    //console.log(`TreeBranch removeClass('${name}')`)
    let superClass = this.conn.classesMap[name].superClass;
    const choice = this._electronService.remote.dialog.showMessageBoxSync(this._electronService.remote.getCurrentWindow(), {
      type: 'question',
      buttons: ['No', 'Yes'],
      title: 'Удалить класс',
      message: `Вы уверены, что хотите безвозвратно удалить класс ${name}?
Все подклассы ${name} будут также удалены, а все экземпляры ${name} и его подклассов
будут переведены в класс ${superClass}.`
    });
    if (choice === 1) {
      let willBeRemoved = this.conn.getClassWithDescendants(name).map(c => c.name)
      let selectedClass = this.getSelectedClass()
      if (willBeRemoved.includes(selectedClass)) this.selectElement(this.conn.classesMap[name].superClass)
      this.conn.removeClass(name);
    }
  }

  hideFakeField() {
    this.fakeEditableChild = false;
    this.newSubclassSuper = '';
  }
  
  isClassNameInvalid(newClass) {
    newClass = this.trim(newClass)
    return (newClass == '' || this.conn.classesMap[newClass])
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
  
  checkClassName(event) {
    var element = event.target || event.srcElement || event.currentTarget;
    
    if (element.value.endsWith('\n') || element.value.endsWith('\r')) {
      element.value = this.trim(this.cutForbidden(element.value))
      element.dispatchEvent(new Event('change', { 'bubbles': true }))
      //console.log('dispatched event')
      return;
    }
    element.value = this.cutForbidden(element.value)

    //console.log(oldValue, element.value, oldValue != element.value)
    let value = this.trim(element.value)

    if (this.isClassNameInvalid(value) && element.className.indexOf('invalid_input') < 0) {
      element.className += ' invalid_input';
    } else {
      element.className = element.className.replace(/\s*invalid_input/g, '');
    }
    //console.log('parent css class =', parent.className, typeof parent.className, parent)
  }

  setNewClassName(event) {
    //console.log(`setNewClassName `, event)
    if (!this.isClassNameInvalid(event.target.value)) {
      this.conn.createClass(event.target.value, this.newSubclassSuper, {})
      this.fakeEditableChild = false;
      this.newSubclassSuper = '';
      this.selectElement(event.target.value)
  
      var element = event.target || event.srcElement || event.currentTarget;
      let parent = element.parentElement.parentElement;
      parent.className = parent.className.replace(/\s*invalid_input/g, '');
    }
  }

  ngOnInit(): void {
    this.level = this.level*1
    console.log('tree margin:' + ((this.level + 1) * 20) + 'px')
  }
}
