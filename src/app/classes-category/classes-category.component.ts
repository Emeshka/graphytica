import { Component, OnInit, Input, NgZone } from '@angular/core';
import { DbServiceService } from '../db-service.service';

@Component({
  selector: 'app-classes-category',
  templateUrl: './classes-category.component.html',
  styleUrls: ['./classes-category.component.css']
})
export class ClassesCategoryComponent implements OnInit {
  constructor(
    private conn: DbServiceService,
    private _nz: NgZone
  ) { }
  /*alias = {
    'V': 'Всего вершин',
    'E': 'Всего ребер',
    '=': 'Всего элементов'
  }*/
  selectedClass = '';
  public classTree = [];
  demo = {
    value: {name: 'vehicles'},
    children: [
        {
            value: {name: 'cars'},
            children: [
                {
                    value: {name: 'vw'},
                    children: [
                        {
                            value: {name: 'golf'},
                            children: []
                        },
                        {
                            value: {name: 'passat'},
                            children: []
                        }
                    ]
                }
            ]
        }
    ]
}
  //mapClassTree = {};
  /*oneditByProp = {
    'name': () => {
      console.log('onedit name')
    },
    'superClass': () => {
      console.log('onedit superClass')
    },
    'clusters': () => {
      console.log('onedit clusters')
    }
  }*/
  @Input() defaultClasses: any = [];
  //defaultProps = [];
  @Input() selectionNodes: any = [];
  @Input() selectionEdges: any = [];
  countEntities = -1;

  /*getClassElements = (className) => {
    return new Promise((resolve, reject) => {
      this.conn.db.select().from(className).all().then(function (array) {
        resolve(array);
      }).catch(e => reject(e));
    })
  };*/

  countClassElements = (className) => {
    return new Promise((resolve, reject) => {
    })
  };

  selectClass = (value) => {
    console.log('selectClass()', value)
    this.selectedClass = value || '';
    /*let nz = this._nz;
    if (value) {
      this.conn.db.select('count(*)').from(value).scalar().then(function(countEntities) {
        nz.run(() => {
          this.countEntities = countEntities
        })
      }).catch(e => reject(e));
    }*/
  }

  updateClassAll() {
    console.log('updateClassAll()')
    let nz = this._nz
    this.conn.db.class.list().then((classes) => {
      let flat = classes//.filter(e => !th.defaultClasses.includes(e.name));
      console.log('There are classes in the db:', classes);

      function getMap(arr) {
        let map = {}, arrElem;
        for(let i = 0, len = arr.length; i < len; i++) {
          console.log(i)
          arrElem = arr[i];
          map[arrElem.name] = {//расплющить класс. иначе tree-branch пойдет в бесконечную проверку item.name (это всё геттеры)
            name: arrElem.name,
            superClass: arrElem.superClass,
            clusterIds: arrElem.clusterIds,
            properties: arrElem.properties
          };
          map[arrElem.name]['children'] = [];
        }
        return map;
      }
      function unflatten(map) {
        let tree = [], mappedElem;

        for (let id in map) {
          console.log(id)
          if (map.hasOwnProperty(id)) {
            mappedElem = map[id];
            if (mappedElem.superClass) {
              map[mappedElem['superClass']]['children'].push(mappedElem);
            } else {
              tree.push(mappedElem);
            }
          }
        }
        return tree;
      }
      let m = getMap(flat);
      console.log(m);
      let t = unflatten(m);
      nz.run(() => {
        //th.mapClassTree = m;
        this.classTree = t;
        console.log("th._nz.run");
      })
    }).then(() => console.log('ended'));
  }

  ngOnInit(): void {
    console.log('ngOnInit() classes-category');
    this.updateClassAll();
    /*
    this.conn.db.query('SELECT @class, count(*) FROM E GROUP BY @class').then(result => {
      console.log('SELECT @class, count(*) FROM E GROUP BY @class:', result);
      let sum = 0;
      for (let i = 0; i<result.length; i++) {
        this.amountByClass[result[i]['class']] = {
          count: result[i].count,
          type: 'E'
        };
        sum += result[i].count;
      }
      this.amountByClass['E'] = sum;
      if (this.amountByClass['V'] || this.amountByClass['V'] === 0) {
        this.amountByClass['='] = this.amountByClass['E'] + this.amountByClass['V']
      }
      console.log('SELECT @class, count(*) FROM E GROUP BY @class:', this.amountByClass);
    })*/
  }
}
