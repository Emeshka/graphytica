/* Коллекция без дубликатов с сохранением порядка элементов и доступом по индексу
 с событиями на добавление, удаление и замену элемента */

export class OSelection {
    _array = [];
    _handlers = {
      itemadded: [],
      itemremoved: [],
      itemset: []
    };
  
    raiseEvent(event) {
      this._handlers[event.type].forEach(function(h) {
        h.call(this, event);
      });
    }
  
    defineIndexProperty(index) {
      if (!(index in this)) {
        Object.defineProperty(this, index, {
          configurable: true,
          enumerable: true,
          get: function() {
            return this._array[index];
          },
          set: function(v) {
            this._array[index] = v;
            this.raiseEvent({
              type: "itemset",
              index: index,
              item: v
            });
          }
        });
      }
    }
  
    addEventListener(eventName, handler): void {
      eventName = ("" + eventName).toLowerCase();
      if (!(eventName in this._handlers)) throw new Error("Invalid event name.");
      if (typeof handler !== "function") throw new Error("Invalid handler.");
      this._handlers[eventName].push(handler);
    }
  
    removeEventListener(eventName, handler): void {
      eventName = ("" + eventName).toLowerCase();
      if (!(eventName in this._handlers)) throw new Error("Invalid event name.");
      if (typeof handler !== "function") throw new Error("Invalid handler.");
      var h = this._handlers[eventName];
      var ln = h.length;
      while (--ln >= 0) {
        if (h[ln] === handler) {
          h.splice(ln, 1);
        }
      }
    }
  
    push(...args): number {
      var index;
      for (var i = 0, ln = args.length; i < ln; i++) {
        if (!this._array.includes(args[i])) {
          index = this._array.length;
          this._array.push(args[i]);
          this.defineIndexProperty(index);
          this.raiseEvent({
          type: "itemadded",
          index: index,
          item: args[i]
          });
        }
      }
      return this._array.length;
    }
  
    pop(): any {
      if (this._array.length > -1) {
        var index = this._array.length - 1, item = this._array.pop();
        delete this[index];
        this.raiseEvent({
          type: "itemremoved",
          index: index,
          item: item
        });
        return item;
      }
    }
  
    unshift(...args): number {
      for (var i = 0, ln = args.length; i < ln; i++) {
        if (!this._array.includes(args[i])) {
          this._array.splice(i, 0, args[i]);
          this.defineIndexProperty(this._array.length - 1);
          this.raiseEvent({
            type: "itemadded",
            index: i,
            item: args[i]
          });
        }
      }
      for (; i < this._array.length; i++) {
        this.raiseEvent({
          type: "itemset",
          index: i,
          item: this._array[i]
        });
      }
      return this._array.length;
    }
  
    shift(): any {
      if (this._array.length > -1) {
        var item = this._array.shift();
        delete this[this._array.length];
        this.raiseEvent({
          type: "itemremoved",
          index: 0,
          item: item
        });
        return item;
      }
    }
  
    splice(index, howMany, ...args /*, element1, element2, ... */ ): any[] {
      var removed = [], item, pos;
  
      index = index == null ? 0 : index < 0 ? this._array.length + index : index;
  
      howMany = howMany == null ? this._array.length - index : howMany > 0 ? howMany : 0;
  
      while (howMany--) {
        item = this._array.splice(index, 1)[0];
        removed.push(item);
        delete this[this._array.length];
        this.raiseEvent({
          type: "itemremoved",
          index: index + removed.length - 1,
          item: item
        });
      }
  
      for (var i = 0, ln = args.length; i < ln; i++) {
        if (!this._array.includes(args[i])) {
          this._array.splice(index, 0, args[i]);
          this.defineIndexProperty(this._array.length - 1);
          this.raiseEvent({
            type: "itemadded",
            index: index,
            item: args[i]
          });
          index++;
        }
      }
  
      return removed;
    }
  
    get length() {
      return this._array.length;
    }
  
    set length(value) {
      var n = Number(value);
      var length = this._array.length;
      if (n % 1 === 0 && n >= 0) {        
        if (n < length) {
          this.splice(n, null);
        } else if (n > length) {
          this.push.apply(this, new Array(n - length));
        }
      } else {
        throw new RangeError("Invalid array length");
      }
      this._array.length = n;
    }

    toString() {
      let str = this._array.toString();
      //console.log('OSelection.toString():', str)
      return str
    }
  
    /* Новые методы */

    private isIterable(collection) {
      if (collection == null || typeof(collection) == 'string') {
        return false
      }
      return typeof collection[Symbol.iterator] === 'function';
    }

    pushAll(collection) {
      if (this.isIterable(collection)) {
        this.push.apply(this, collection);
      } else {
        throw new Error("Invalid argument for pushAll(): not iterable.");
      }
    }

    getArray() {
      return this._array.map((x) => x);
    }

    remove(item) {
      let index = this._array.indexOf(item)
      if (index >= 0) this.splice(index, 1)
    }

    constructor(items) {
      /*Object.getOwnPropertyNames(Array.prototype).forEach(function(name) {
        if (!(name in this)) {
          Object.defineProperty(this, name, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Array.prototype[name]
          });
        }
      });*/
      if (this.isIterable(items)) {
        this.push.apply(this, items);
      } else {
        throw new Error("Invalid argument for OSelection constructor: not iterable.");
      }
    }
  }