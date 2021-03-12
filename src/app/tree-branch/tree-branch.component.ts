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
  @Input() selectElement = () => {};
  newSubclassSuper = '';
  fakeEditableChild = false;

  newSubclass(superClass) {
    console.log(`TreeBranch newSubclass('${superClass}')`);
    this.newSubclassSuper = superClass;
    this.fakeEditableChild = true;
  }

  removeClass(name) {
    console.log(`TreeBranch removeClass('${name}')`)
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
      let names = this.conn.getClassWithDescendants(name).map(c => c.name);
      let descendantsSelector = '[_class = "'+names.join('"], [_class = "')+'"]';
      let eles = this.conn.cy.$(descendantsSelector);
      eles.data('_class', superClass);

      for (let name of names) {
        this.conn.removeClass(name);
      }
    }
  }

  hideFakeField() {
    this.fakeEditableChild = false;
    this.newSubclassSuper = '';
  }

  setNewClassName(name) {
    this.conn.createClass(name, this.newSubclassSuper, {})
    this.fakeEditableChild = false;
    this.newSubclassSuper = '';
  }

  ngOnInit(): void {
    //console.log('ngOnInit() tree-branch');//, this.level, this.tree
  }
  
  /*ngAfterViewChecked () {
    console.log('Rendered');
  }*/
}
