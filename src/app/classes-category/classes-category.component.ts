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
  @Input() defaultClasses: any = [];
  @Input() selection: any = [];
  readonly supportedAttributes = ['type', 'mandatory'];
  /* TODO add support of other attributes https://orientdb.com/docs/3.0.x/sql/SQL-Alter-Property.html */
  public selectedClass = '';
  public classTree = [];
  mapClassTree = {};
  countEntities = -1;
  countDirectEntities = -1;
  selectedDirectChildren = [];
  selectedFieldList = {};

  /*
  
  пример создания свойств с доп. параметрами
  return db.class.create('HasApplied', 'E')
    .then((hasApplied) => {
      return hasApplied.property.create(
        [{
          name: 'out',
          type: 'link',
          linkedClass: 'Consultant',
          mandatory: true
        }, {
          name: 'in',
          type: 'link',
          linkedClass: 'Job',
          mandatory: true
        }, {
          name: 'technicalQuestions',
          type: 'embedded'
        }, {
          name: 'technicalAnswers',
          type: 'embedded'
        }, {
          name: 'behavioralQuestions',
          type: 'embedded'
        }, {
          name: 'behavioralAnswers',
          type: 'embedded'
        }, {
          name: 'artifacts',
          type: 'embeddedset'
        }, {
          name: 'comments',
          type: 'string',
        }, {
          name: 'createdAt',
          type: 'datetime'
        }, {
          name: 'updatedAt',
          type: 'datetime'
        }]
      );
    })
  
    supported types
    https://orientdb.com/docs/3.0.x/general/Types.html
  */
  addToSelection = () => {
    this.conn.db.select('@rid').from(this.selectedClass).all().then(function(array) {
      console.log('addToSelection():', array)
      this.selection.pushAll(array);
    }).catch(e => console.log(e));
  };

  selectClass = (value) => {
    console.log('selectClass()', value);

    this.selectedDirectChildren = this.mapClassTree[value].children.map(cl => cl.name);
    this.conn.db.class.get(value).then((cl) => {
      cl.property.list().then((list) => {
        let map = {};
        list.forEach((f) => {
          map[f.name] = {}
          for (let attr of this.supportedAttributes) {
            map[f.name][attr] = f[attr]
          }
        })
        this.selectedFieldList = map;
      })
    })

    if (value) {
      this.conn.db.select('count(*)').from(value).scalar().then((count) => {
        this.countEntities = count;
      }).catch(e => console.log(e));

      this.conn.db.select('count(*)').from(value).where({
        '@class': value
      }).scalar().then((count) => {
        this.countDirectEntities = count;
      }).catch(e => console.log(e));
    }

    this.selectedClass = value || '';
  }

  updateClassAll() {
    //console.log('updateClassAll()')
    let nz = this._nz
    this.conn.db.class.list().then((classes) => {
      let flat = classes//.filter(e => !th.defaultClasses.includes(e.name));
      //console.log('There are classes in the db:', classes);

      function getMap(arr) {
        let map = {}, arrElem;
        for(let i = 0, len = arr.length; i < len; i++) {
          console.log(i)
          arrElem = arr[i];
          map[arrElem.name] = {//расплющить класс. иначе tree-branch пойдет в бесконечную проверку item.name (это всё геттеры)
            name: arrElem.name,
            superClass: arrElem.superClass,
            clusterCount: arrElem.clusterIds.length
            //properties: arrElem.properties
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
      //console.log(m);
      let t = unflatten(m);
      nz.run(() => {
        this.mapClassTree = m;
        this.classTree = t;
        //console.log("th._nz.run");
      })
    })//.then(() => console.log('ended'));
  }

  ngOnInit(): void {
    //console.log('ngOnInit() classes-category');
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
