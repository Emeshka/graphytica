import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'tree-branch',
  templateUrl: './tree-branch.component.html',
  styleUrls: ['./tree-branch.component.css']
})
export class TreeBranchComponent implements OnInit {

  constructor() { }
  @Input() tree: any = null;
  @Input() level: number = 0;
  @Input() selectElement = () => {};

  ngOnInit(): void {
    //console.log('ngOnInit() tree-branch');//, this.level, this.tree
  }
  
  /*ngAfterViewChecked () {
    console.log('Rendered');
  }*/
}
