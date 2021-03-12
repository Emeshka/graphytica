import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class DbServiceService {

  constructor(
    private _electronService: ElectronService) { }

  //////////////////////////////////////////

  private fs = this._electronService.remote.require('fs');
  cy = null;
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
              if (c.name != 'V' && c.name != 'E') this.classes.push(c);
              else {
                let oldProps = this.classesMap[c.name].properties;
                let newProps = c.properties;
                for (let p in newProps) {
                  let newPropName = p
                  while (newPropName in oldProps) {
                    newPropName = p + (Math.floor(Math.random() * 1000))
                  }
                  if (newPropName != p) {
                    // refactor data
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
        console.log(i)
        arrElem = arr[i];
        map[arrElem.name] = arrElem;
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
    }
  }

  getClass(name) {
    return this.classes.find(c => c.name == name)
  }

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

  alterClass(name, params) {
    if (!name || !params) throw `Invalid alterClass() call: name=${name}, params=${params}`
    else {
      let c = this.classesMap[name]
      for (let t in params) {
        if ((t == 'name' || t == 'superClass') && typeof params[t] == 'string') {
          if (name == 'V' || name == 'E') {
            throw `Failed class alteration: class ${name} must stay root and cannot be renamed`
          }
          if (t == name && this.cy) {
            // refactor
          }
          c[t] = params[t];
          this.update();
        } else if (t == 'addProperties') {
          for (let propName in params[t]) c.properties[propName] = params[t][propName]
        } else if (t == 'removeProperties') {
          for (let propName of params[t]) delete c.properties[propName]
        }
      }
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
        } else if (attr == 'name') {
          c.properties[params.name] = p;
          delete c.properties[propName];
          // refactor
        }
      }
    }
  }

  removeClass(name) {//remove specified only. subclasses remain
    if (name == 'V' || name == 'E') {
      throw `Failed class removal: class ${name} cannot be removed`
    }
    let cl = this.classes.find(c => c.name == name)
    let index = this.classes.indexOf(cl)
    if (index >= 0) {
      this.classes.splice(index, 1);
      this.update();
    }
  }
}