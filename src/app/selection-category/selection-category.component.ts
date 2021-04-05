import { Component, OnInit, Input, SimpleChanges, OnDestroy } from '@angular/core';
import { DbServiceService } from '../db-service.service';

@Component({
  selector: 'selection-category',
  templateUrl: './selection-category.component.html',
  styleUrls: ['./selection-category.component.css']
})
export class SelectionCategoryComponent implements OnInit, OnDestroy {

  constructor(
    private conn: DbServiceService
  ) { }

  @Input() selection: any;
  @Input() toolById;
  @Input() activeToolId: string;

  showBasicTable = true;
  entities = null;
  areEdges = false;
  classDefinedProps = null;
  commonClass = '';
  freeProps = null;
  propsOfNew = null;

  selectionListener = null;

  updateTable(toolId) {
    if (this.selectionListener) this.selectionListener();
    this.showBasicTable = true;
    /*if (toolId == 'new_vertex' || toolId == 'new_edge') {
      this.commonClass = this.toolById[toolId].settings['selectClass'].value;
      this.classDefinedProps = this.conn.getAllProps(this.commonClass);
      this.showBasicTable = false;
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
      this.showBasicTable = true;
      //this.propsOfNew = {};
    }*/
    //console.log('switchEditSelected():', this.propsOfNew)
  }

  panToElement(id) {
    this.conn.cy.center(this.conn.getById(id))
  }

  ngOnInit(): void {
    setTimeout(() => {
      let f = () => {
        let arr = this.selection.getArray();
        let commonClass = '';
        let freeCommonProps = null;
        let areEdges = true;
        let areVertices = true;
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
          let meta = ['_class', 'id', 'parent']
          if (e.isEdge()) {
            meta.push('target', 'source');
          }
          console.log(e.json(), e.isNode(), e.isEdge())
          areEdges = areEdges && e.isEdge();
          areVertices = areVertices && e.isNode();
          let eFreeProps = []
  
          for (let d of data) {
            if (!meta.includes(d) && !eClassDefined.includes(d)) {
              if (e.data(d) !== null && e.data(d) !== undefined) {
                eFreeProps.push(d)
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
        this.commonClass = commonClass;
        this.freeProps = (freeCommonProps && freeCommonProps.length > 0) ? freeCommonProps : [];
        this.entities = arr.length > 0 ? arr.map(e => {
          let data = e.data()
          if (e.isEdge()) {
            data.source = e.source().data('id')
            data.target = e.target().data('id')
          }
          return data
        }) : [];
        if (this.entities.length == 0) {
          this.areEdges = null
        } else {
          this.areEdges = areEdges ? true : (areVertices ? false : null);
        }
        //console.log('selection-category.selectionListener():', this.entities, this.classDefinedProps, this.freeProps)
      }
      this.selectionListener = f.bind(this)
      this.selection.addEventListener('itemadded', this.selectionListener)
      this.selection.addEventListener('itemset', this.selectionListener)
      this.selection.addEventListener('itemremoved', this.selectionListener)
  
      this.updateTable(this.activeToolId)
    })
  }

  ngOnDestroy(): void {
    this.selection.removeEventListener('itemadded', this.selectionListener)
    this.selection.removeEventListener('itemset', this.selectionListener)
    this.selection.removeEventListener('itemremoved', this.selectionListener)
    this.selectionListener = null
  }
}
