import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { BehaviorSubject } from 'rxjs';
import { SelectQuery } from './selection-category/SelectQuery';

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
  readonly supportedTypes = ['string', 'number', 'boolean', 'date'/*, 'time', 'datetime'*/];

  private lastId = -1;
  classes = [];
  classesMap = {};
  classesTree = {};

  styleRules = [];

  export(path, data, callback, onerror): void {
    try {
      if (!data) {
        if (this.cy) {
          data = this.cy.elements().not(this.cy.$('.edge_bend_point')).jsons();
        } else {
          data = [];
        }
      }
      let zoom = this.cy ? this.cy.zoom() : 1;
      let pan = this.cy ? this.cy.pan() : {x: 100, y: 100};
      let cloneClasses = this.classes.map(c => {
        return {
          name: c.name,
          superClass: c.superClass,
          properties: c.properties
        }
      })
      let styleObj = this.cy ? this.cy.style().json() : []
      styleObj = styleObj.filter((entry) => entry.selector != '._gridParentPadding')
      console.log(cloneClasses)
      let fullData = {
        data: data,
        style: styleObj,
        lastId: this.lastId,
        classes: cloneClasses,
        styleRules: this.styleRules,
        zoom: zoom,
        pan: pan
      }
      this.fs.writeFile(path, JSON.stringify(fullData, (key, value) => {
        if (value !== null) return value;
      }), function(error) {
        if (error) {
          console.log(error);
          if (typeof callback == 'function') callback(null, null)
        } else {
          if (typeof callback == 'function') callback(path, {
            data: data,
            zoom: zoom,
            style: styleObj,
            styleRules: this.styleRules,
            pan: pan
          })
        }
      });
    } catch (err) {
      console.log(err);
      if (typeof callback == 'function') callback(null, null)
      if (onerror) onerror(err)
    }
  }

  import(path, merge, callback, onerror): void {
    try {
      this.fs.readFile(path, 'utf8', (e, fileContent) => {
        if (e) {
          console.log(e);
          if (typeof callback == 'function') callback(null, null)
          if (onerror) onerror(e)
          return;
        }

        try {
          let fullData = JSON.parse(fileContent);
          if (!fullData || !(fullData.data instanceof Array) || !(typeof fullData.lastId == 'number')) {
            if (typeof callback == 'function') callback(null, null)
          } else {
            if (merge) {
              let toRefactor = {}
              for (let c of fullData.classes) {
                if (c.name != 'V' && c.name != 'E') {
                  if (this.classesMap[c.name]) {
                    let newClassName = c.name
                    while (newClassName in this.classesMap) {
                      newClassName = c.name + '_' + (Math.floor(Math.random() * 100000))
                    }
                    toRefactor[c.name] = {
                      renameInNew: newClassName
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
                      newPropName = p + '_' + (Math.floor(Math.random() * 100000))
                    }

                    if (!toRefactor[c.name]) toRefactor[c.name] = {}

                    if (newPropName == p) {
                      if (!toRefactor[c.name].addPropertiesToOld) {
                        toRefactor[c.name].addPropertiesToOld = {}
                      }
                      toRefactor[c.name].addPropertiesToOld[p] = ''
                    } else {
                      if (!toRefactor[c.name].renameProperties) {
                        toRefactor[c.name].renameProperties = {}
                      }
                      toRefactor[c.name].renameProperties[p] = newPropName
                    }
                    
                    oldProps[newPropName] = newProps[p]
                  }
                  for (let p in oldProps) {
                    if (!(p in newProps)) {
                      if (!toRefactor[c.name].addPropertiesToNew) {
                        toRefactor[c.name].addPropertiesToNew = []
                      }
                      toRefactor[c.name].addPropertiesToNew.push(p)
                    }
                  }
                }
              }

              //refactor new
              for (let e of fullData.data) {
                for (let cName in toRefactor) {
                  if (e.data['class'] == cName) {
                    let r = toRefactor[cName]
                    if (r.renameInNew) {
                      e.data['class'] = toRefactor[cName].renameInNew
                    }

                    if (r.renameProperties) {
                      for (let p in r.renameProperties) {
                        if (e.data[p]) {
                          let newPropName = r.renameProperties[p]
                          e.data[newPropName] = e.data[p]
                          delete e.data[p];
                        }
                      }
                    }

                    if (r.addPropertiesToNew) {
                      for (let p of r.addPropertiesToNew) {
                        e.data[p] = ''
                      }
                    }
                  }
                }
              }

              //refactor old
              if (toRefactor['V'] && toRefactor['V'].addPropertiesToOld) {
                this.getDirectInstances('V').data(toRefactor['V'].addPropertiesToOld)
              }
              if (toRefactor['E'] && toRefactor['E'].addPropertiesToOld) {
                this.getDirectInstances('E').data(toRefactor['E'].addPropertiesToOld)
              }
              if (fullData.styleRules) this.styleRules.push(...fullData.styleRules)
            } else {
              this.lastId = fullData.lastId
              this.classes = fullData.classes
              if (fullData.styleRules) this.styleRules = fullData.styleRules
            }
            this.update();
            let dateTypes = ['date', 'time', 'datetime']
            for (let e of fullData.data) {
              for (let p in e.data) {
                let standard = p == 'id' || p == 'class' || p == 'parent'
                let standardEdges = e.group == 'edges' && (p == 'target' || p == 'source')
                if (standard || standardEdges || !e.data[p]) continue;
                //let c = this.classesMap[e.data['class']]
                let props = this.getAllProps(e.data['class']);
                //console.log(e.data.id, p, props[p])
                if (props[p] && dateTypes.includes(props[p].type)) {
                  e.data[p] = new Date(e.data[p])
                }
              }
            }
            if (fullData.styleRules) {
              for (let r of fullData.styleRules) {
                r.condition = new SelectQuery(r.condition)
                this.applyStyleRule(r)
              }
            }
            if (typeof callback == 'function') callback(path, {
              data: fullData.data,
              style: fullData.style,
              zoom: fullData.zoom,
              pan: fullData.pan
            })
          }
        } catch (err) {
          console.log(err);
          if (typeof callback == 'function') callback(null, null)
          if (onerror) onerror(err)
        }
      });
    } catch (err) {
      console.log(err);
      if (typeof callback == 'function') callback(null, null)
      if (onerror) onerror(err)
    }
  }

  initializeNew() {
    this.classes = [
      {
        name: 'V',
        superClass: "",
        properties: {}
      },
      {
        name: 'E',
        superClass: "",
        properties: {}
      }
    ];
    this.styleRules = []
    this.update();
  }

  private update() {
    function getClassMap(arr) {
      let map = {}, arrElem;
      for(let i = 0, len = arr.length; i < len; i++) {
        arrElem = arr[i];
        map[arrElem.name] = arrElem;
        map[arrElem.name]['children'] = [];
      }
      return map;
    }

    function unflatten(map) {
      let tree = [], mappedElem;

      for (let id in map) {
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
      for (const key in properties) {
        properties[key].owner = name
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

  getAllInstances(className) {
    let accum = this.getClassWithDescendants(className).map(c => c.name);
    let descendantsSelector = '[class = "'+accum.join('"], [class = "')+'"]';
    return this.cy.$(descendantsSelector);
  }

  getDirectInstances(className) {
    return this.cy.$(`[class = '${className}']`)
  }

  getById(id) {
    return this.cy.$(`[id = '${id}']`)
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

  getClosestCommonAncestor(className1, className2) {
    let c1 = this.classesMap[className1];
    let c2 = this.classesMap[className2];
    if (!c1) {
      console.warn(`Invalid getClosestCommonAncestor() call: first class ${className1} doesn't exist`)
      return
    }
    if (!c2) {
      console.warn(`Invalid getClosestCommonAncestor() call: second class ${className2} doesn't exist`)
      return
    }

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
            /*let elements = this.cy.elements();
            for (let e of elements) {
              if (e.data('class') == className) {
                e.data('class', params.name)
              }
            }*/
            let elements = this.getDirectInstances(className)
            elements.data('class', params.name)
          }
          c[t] = params[t];
          this.update();
        } else if (t == 'addProperties') {
          let elements = this.getAllInstances(className)
          for (let propName in params[t]) {
            c.properties[propName] = params[t][propName]
            c.properties[propName].owner = className
            //elements.data(propName, '')
            for (let e of elements) {
              let oldValue = e.data(propName)
              if (!oldValue) {
                e.data('')
              } else {
                let type = c.properties[propName].type
                let newValue
                switch (type) {
                  case 'number': newValue = oldValue*1; break;
                  case 'string': newValue = ''+oldValue; break;
                  case 'boolean': newValue = !!(oldValue && oldValue != 'false'); break;
                  case 'date': newValue = new Date(oldValue); break;
                }
                if (isNaN(newValue)) {
                  e.data('')
                } else {
                  e.data(newValue)
                }
              }
            }
          }
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
          /*let elements = this.cy.elements();
          for (let e of elements) {
            if (e.data('class') == className && e.data(propName)) {
              e.data(params.name, e.data(propName))
              e.removeData(propName)
            }
          }*/
          let elements = this.getAllInstances(className)
          for (let el of elements) {
            let value = el.data(propName)
            if (value) {
              el.data(params.name, value)
              el.removeData(propName)
            }
          }
        }
      }
      this.change.next(true);
    }
  }

  removeClass(name) {
    if (name == 'V' || name == 'E') {
      throw `Failed class removal: class ${name} cannot be removed`
    }
    let cl = this.classes.find(c => c.name == name)
    let index = this.classes.indexOf(cl)
    if (index >= 0) {
      let names = this.getClassWithDescendants(name).map(c => c.name);
      this.getAllInstances(name).data('class', cl.superClass);

      for (let name of names) {
        this.classes.splice(index, 1)
        cl = this.classes.find(c => c.name == name)
        index = this.classes.indexOf(cl)
      }
      this.update();
      this.change.next(true);
    } else throw `Failed class removal: class ${name} doesn't exist`
  }

  applyStyleRule(settings) {
    const query = settings.condition
    const name = settings.name
    const then = settings.then

    let classStylesObj = {}
    for (let entry of then) {
      if (entry.calculator == 'equals') {
        classStylesObj[entry.what] = entry.value
      } else if (entry.calculator == 'data') {
        classStylesObj[entry.what] = 'data(' + entry.value + ')'
      } else if (entry.calculator == 'mapData') {
        classStylesObj[entry.what] = 'mapData(' + entry.value.join(', ') + ')'
      }
    }
    console.log(classStylesObj)
    this.cy.style().selector('.' + name).style(classStylesObj).update()

    let elems = query.execute(this.cy)
    for (let ele of elems) {
      ele.toggleClass(name, true)
      console.log(ele.classes())
    }
  }

  addStyleRule(settings) {
    console.log(settings)
    if (settings.condition instanceof SelectQuery && settings.condition.tree.type == 'selector' 
          && settings.name && settings.then instanceof Array) {
      this.styleRules.push(settings)
      this.applyStyleRule(settings)
    }
  }

  removeStyleRule(rule) {
    let index = this.styleRules.indexOf(rule)
    if (index >= 0) {
      let elems = rule.condition.execute(this.cy)
      for (let ele of elems) {
        ele.toggleClass(name, false)
      }
      this.styleRules.splice(index, 1)
      
      let currentStyle = this.cy.style().json()
      currentStyle.splice(currentStyle.findIndex(s => s.selector == '.'+rule.name), 1)
      this.cy.style().fromJson(currentStyle).update()
    }
  }
}