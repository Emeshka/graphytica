import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DbServiceService {

  constructor(
    private _electronService: ElectronService) { }

  //////////////////////////////////////////

  private fs = this._electronService.remote.require('fs');
  cy = null;
  change: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly supportedAttributes = ['type'];
  readonly supportedTypes = ['string', 'number', 'boolean'];

  private lastId = -1;
  classes = [];
  classesMap = {};
  classesTree = {};

  export(path, data, callback): void {//async
    if (!data) {
      if (this.cy) {
        data = this.cy.elements().jsons();
      } else {
        data = [];
      }
    }
    let zoom = this.cy ? this.cy.zoom() : 1;
    let pan = this.cy ? this.cy.pan() : {x: 100, y: 100};
    let fullData = {
      data: data,
      lastId: this.lastId,
      classes: this.classes,
      zoom: zoom,
      pan: pan
    }
    console.log(callback, typeof callback, fullData)
    this.fs.writeFile(path, JSON.stringify(fullData), function(error) {
      if (error) {
        console.log(error);
        if (typeof callback == 'function') callback(null, null)
      } else {
        if (typeof callback == 'function') callback(path, {
          data: data,
          zoom: zoom,
          pan: pan
        })
      }
    });
  }

  import(path, merge, callback): void {//async
    try {
      this.fs.readFile(path, 'utf8', (e, fileContent) => {
        if (e) {
          console.log(e);
          if (typeof callback == 'function') callback(null, null)
          return;
        }
        let fullData = JSON.parse(fileContent);
        if (!fullData || !(fullData.data instanceof Array) || !(typeof fullData.lastId == 'number')) {
          if (typeof callback == 'function') callback(null, null)
        } else {
          if (!merge) {
            this.lastId = fullData.lastId
            this.classes = fullData.classes
          } else {
            for (let c of fullData.classes) {
              if (c.name != 'V' && c.name != 'E') {
                if (this.classesMap[c.name]) {
                  // done refactor data
                  let newClassName = c.name
                  while (newClassName in this.classesMap) {
                    newClassName = c.name + (Math.floor(Math.random() * 1000))
                  }
                  for (let e of fullData.data) {
                    if (e.data['_class'] == c.name) {
                      e.data['_class'] = newClassName
                    }
                  }
                  c.name = newClassName
                }
                this.classes.push(c);
              } else {
                let oldProps = this.classesMap[c.name].properties;
                let newProps = c.properties;
                for (let p in newProps) {
                  let newPropName = p
                  while (newPropName in oldProps) {
                    newPropName = p + (Math.floor(Math.random() * 1000))
                  }
                  if (newPropName != p) {
                    // done refactor data
                    for (let e of fullData.data) {
                      if (e.data['_class'] == c.name && e.data[p]) {
                        e.data[newPropName] = e.data[p]
                        delete e.data[p];
                      }
                    }
                  }
                  oldProps[newPropName] = newProps[p]
                }
              }
            }
          }
          this.update();
          if (typeof callback == 'function') callback(path, {
            data: fullData.data,
            zoom: fullData.zoom,
            pan: fullData.pan
          })
        }
      });
    } catch (err) {
        console.log(err);
        if (typeof callback == 'function') callback(null, null)
    }
  }

  initializeNew() {
    this.classes = [
      {
        name: 'V',
        superClass: null,
        properties: {}
      },
      {
        name: 'E',
        superClass: null,
        properties: {}
      }
    ];
    this.update();
  }

  private update() {
    function getClassMap(arr) {
      let map = {}, arrElem;
      for(let i = 0, len = arr.length; i < len; i++) {
        //console.log(i)
        arrElem = arr[i];
        map[arrElem.name] = arrElem;
        map[arrElem.name]['children'] = [];
      }
      return map;
    }

    function unflatten(map) {
      let tree = [], mappedElem;

      for (let id in map) {
        //console.log(id)
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
    this.classesMap = getClassMap(this.classes);
    this.classesTree = unflatten(this.classesMap);
  }

  nextId(): string {
    this.lastId++;
    return this.lastId.toString(36);
  }

  createClass(name, superClass, properties) {
    if (typeof name != 'string' || typeof superClass != 'string' || !(typeof properties == 'object')) {
      throw `Invalid arguments for class creation: name=${name}, superClass=${superClass}, properties=${properties}`
    } else {
      if (this.classesMap[name]) {
        throw  `Failed class creation: class ${name} exists`
      }
      if (!this.classesMap[superClass]) {
        throw `Failed class creation: superclass ${superClass} doesn't exist`
      }
      this.classes.push({
        name: name,
        superClass: superClass,
        properties: properties
      })
      this.update();
      this.change.next(true);
    }
  }

  /*getClass(name) {
    return this.classes.find(c => c.name == name)
  }*/

  getClassWithDescendants(className) {
    let map = this.classesMap;
    function step(className, accumArray) {
      let arr = map[className].children
      if (arr) {
        for (let c of arr) {
          accumArray.push(c);
          step(c.name, accumArray);
        }
      }
    }
    let accum = [this.classesMap[className]];
    step(className, accum);
    return accum;
  }

  getClosestCommonAncestor(className1, className2) {
    let c1 = this.classesMap[className1];
    let c2 = this.classesMap[className2];
    if (!c1) throw `Invalid getClosestCommonAncestor() call: first class ${className1} doesn't exist`
    if (!c2) throw `Invalid getClosestCommonAncestor() call: second class ${className2} doesn't exist`

    /*let classAncestors1 = [className1];
    let superName1 = c1.superClass;
    while (superName1) {
      classAncestors1.push(superName1)
      superName1 = this.classesMap[superName1].superClass;
    }*/
    let classAncestors1 = [className1].concat(this.getSuperStack(className1).map(c => c.name))

    let superName2 = className2;
    while (superName2) {
      for (let i = 0; i < classAncestors1.length; i++) {
        if (superName2 == classAncestors1[i]) {
          return superName2
        }
      }
      superName2 = this.classesMap[superName2].superClass;
    }
    return '';
  }

  getAllProps(className) {
    let c = this.classesMap[className]
    if (!c) throw `Invalid getAllProps() call: class ${className} doesn't exist`
    let arr = [c].concat(this.getSuperStack(className))
    let props = {};
    for (let c of arr) {
      for (let p in c.properties) {
        props[p] = c.properties[p]
      }
    }
    return props;
  }

  getSuperStack(className) {
    let c = this.classesMap[className]
    if (!c) throw `Invalid getSuperStack() call: class ${className} doesn't exist`
    let superName = c.superClass
    let stack = []
    while (superName) {
      let s = this.classesMap[superName]
      stack.push(s)
      superName = s.superClass;
    }
    return stack;
  }

  alterClass(className, params) {
    if (!className || !params) throw `Invalid alterClass() call: className=${className}, params=${params}`
    else {
      console.log('alterClass():', className, params)
      let c = this.classesMap[className]
      for (let t in params) {
        let changeName = (t == 'name' && params.name != className)
        let changeSuper = (t == 'superClass' && params.superClass != c.superClass)
        if ((changeName || changeSuper)  && typeof params[t] == 'string') {
          if (className == 'V' || className == 'E') {
            throw `Failed class alteration: class ${className} must stay root and cannot be renamed`
          }
          if (t == 'name' && this.cy) {
            // done refactor
            let elements = this.cy.elements();
            for (let e of elements) {
              if (e.data('_class') == className) {
                e.data('_class', params.name)
              }
            }
          }
          c[t] = params[t];
          this.update();
        } else if (t == 'addProperties') {
          for (let propName in params[t]) c.properties[propName] = params[t][propName]
        } else if (t == 'removeProperties') {
          for (let propName of params[t]) delete c.properties[propName]
        }
      }
      this.change.next(true);
    }
  }

  alterProperty(className, propName, params) {
    if (!className || !propName || !params) throw `Invalid alterProperty() call: className=${className}, propName=${propName}, params=${params}`
    else {
      let c = this.classesMap[className]
      let p = c.properties[propName]
      for (let attr in params) {
        if (this.supportedAttributes.includes(attr)) {
          p[attr] = params[attr]
        } else if (attr == 'name' && params.name != propName) {
          c.properties[params.name] = p;
          delete c.properties[propName];
          // done refactor
          let elements = this.cy.elements();
          for (let e of elements) {
            if (e.data('_class') == className && e.data(propName)) {
              e.data(params.name, e.data(propName))
              e.removeData(propName)
            }
          }
        }
      }
      this.change.next(true);
    }
  }

  removeClass(name) {//remove specified only. subclasses remain
    if (name == 'V' || name == 'E') {
      throw `Failed class removal: class ${name} cannot be removed`
    }
    let cl = this.classes.find(c => c.name == name)
    let index = this.classes.indexOf(cl)
    if (index >= 0) {
      let names = this.getClassWithDescendants(name).map(c => c.name);
      let descendantsSelector = '[_class = "'+names.join('"], [_class = "')+'"]';
      let eles = this.cy.$(descendantsSelector);
      eles.data('_class', cl.superClass);

      for (let name of names) {
        this.classes.splice(index, 1)
        cl = this.classes.find(c => c.name == name)
        index = this.classes.indexOf(cl)
      }
      this.update();
      this.change.next(true);
    } else throw `Failed class removal: class ${name} doesn't exist`
  }
}