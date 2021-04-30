/* Коллекция без дубликатов с сохранением порядка элементов и доступом по индексу
 с событиями на добавление, удаление и замену элемента */

export class SelectQuery {
    public static readonly operators = [
      {
        name: '.unify',
        //regex: /(\d+)\.unify\((\d+)\)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.unify' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        accepts: 'any',
        returns: 'any',
        tip: 'a1.unify(a2)\nОбъединить коллекцию элементов a1 и коллекцию элементов a2',
        call: (args) => {
          return args[0].value.union(args[1].value)
        }
      },
      {
        name: '.diff',
        //regex: /(\d+)\.diff\((\d+)\)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.diff' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        accepts: 'any',
        returns: 'any',
        tip: 'a1.diff(a2)\nВычесть коллекцию элементов a2 из коллекции элементов a1',
        call: (args) => {
          return args[0].value.difference(args[1])
        }
      },
      {
        name: '.intersect',
        //regex: /(\d+)\.intersect\((\d+)\)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.intersect' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        accepts: 'any',
        returns: 'any',
        tip: 'a1.intersect(a2)\nПересечь коллекцию элементов a1 с коллекцией элементов a2',
        call: (args) => {
          return args[0].value.intersection(args[1].value)
        }
      },
      {
        name: '.openNeighborhood',
        //regex: /(\d+)\.openNeighborhood/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.openNeighborhood') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'any',
        returns: 'any',
        tip: 'a1.openNeighborhood\nПолучить для коллекции a1 соседние элементы (вершины и ребра, соединяющие a1 с ними)',
        call: (args) => {
          return args[0].value.openNeighborhood()
        }
      },
      {
        name: '.closedNeighborhood',
        //regex: /(\d+)\.closedNeighborhood/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.closedNeighborhood') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'any',
        returns: 'any',
        tip: 'a1.closedNeighborhood\nПолучить для коллекции a1 соседние элементы (вершины и ребра, соединяющие a1 с ними), включая саму коллекцию a1',
        call: (args) => {
          return args[0].value.closedNeighborhood()
        }
      },
      {
        name: '.edgesWith',
        //regex: /(\d+)\.edgesWith\((\d+)\)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.edgesWith' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'edges',
        tip: 'n1.edgesWith(n2)\nПолучить ребра, связывающие коллекции вершин n1 и n2 (направление неважно)',
        call: (args) => {
          return args[0].value.edgesWith(args[1].value)
        }
      },
      {
        name: '.edgesTo',
        //regex: /(\d+)\.edgesTo\((\d+)\)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.edgesTo' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'edges',
        tip: 'n1.edgesTo(n2)\nПолучить ребра, непосредственно выходящие из вершин коллекции n1 и входящие в ребра коллекции n2',
        call: (args) => {
          return args[0].value.edgesTo(args[1].value)
        }
      },
      {
        name: '.connectedNodes',
        //regex: /(\d+)\.connectedNodes/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.connectedNodes') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'edges',
        returns: 'nodes',
        tip: 'e1.connectedNodes\nПолучить вершины, являющиеся началами и концами ребер коллекции e1',
        call: (args) => {
          return args[0].value.connectedNodes()
        }
      },
      {
        name: '.connectedEdges',
        //regex: /(\d+)\.connectedEdges/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.connectedEdges') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'edges',
        tip: 'n1.connectedEdges\nПолучить ребра непосредственно входящие и выходящие из вершин коллекции n1',
        call: (args) => {
          return args[0].value.connectedEdges()
        }
      },
      {
        name: '.sources',
        //regex: /(\d+)\.sources/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.sources') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'edges',
        returns: 'nodes',
        tip: 'e1.sources\nПолучить начала ребер колекции e1',
        call: (args) => {
          return args[0].value.sources()
        }
      },
      {
        name: '.targets',
        //regex: /(\d+)\.targets/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.targets') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'edges',
        returns: 'nodes',
        tip: 'e1.targets\nПолучить концы ребер коллекции e1',
        call: (args) => {
          return args[0].value.targets()
        }
      },
      {
        name: '.outgoers',
        //regex: /(\d+)\.outgoers/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.outgoers') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'edges',
        tip: 'n1.outgoers\nПолучить ребра, непосредственно выходящие из вершин коллекции n1',
        call: (args) => {
          return args[0].value.outgoers()
        }
      },
      {
        name: '.successors',
        //regex: /(\d+)\.successors/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.successors') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'edges',
        tip: 'n1.successors\nПолучить все ребра, выходящие из вершин коллекции n1 (как рекурсивный вызов outgoers)',
        call: (args) => {
          return args[0].value.successors()
        }
      },
      {
        name: '.incomers',
        //regex: /(\d+)\.incomers/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.incomers') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'edges',
        tip: 'n1.incomers\nПолучить ребра, непосредственно входящие в вершины коллекции n1',
        call: (args) => {
          return args[0].value.incomers()
        }
      },
      {
        name: '.predecessors',
        //regex: /(\d+)\.predecessors/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.predecessors') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'edges',
        tip: 'n1.predecessors\nПолучить все ребра, входящие в вершины коллекции n1 (как рекурсивный вызов incomers)',
        call: (args) => {
          return args[0].value.predecessors()
        }
      },
      {
        name: '.roots',
        //regex: /(\d+)\.roots/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.roots') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'nodes',
        tip: 'n1.roots\nИз коллекции вершин n1 оставить лишь корни (вершины без входящих ребер)',
        call: (args) => {
          return args[0].value.roots()
        }
      },
      {
        name: '.leaves',
        //regex: /(\d+)\.leaves/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '.leaves') {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o1)]
            }
          } else return null;
        },
        accepts: 'nodes',
        returns: 'nodes',
        tip: 'n1.leaves\nИз коллекции вершин n1 оставить лишь листья (вершины без выходящих ребер)',
        call: (args) => {
          return args[0].value.leaves()
        }
      }
    ]

    // infix, prefix, postfix
    private static readonly primitiveOperators = [
      {
        name: '=',
        style: 'infix',
        //regex: /([a-z]+) = ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '=' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        tip: 'a = b\nТочное равенство a и b (Javascript: a === b) (см. стандарт ECMAScript 2015)',
        call: (args) => {
          return args[0].value === args[1].value
        }
      },
      {
        name: '<',
        style: 'infix',
        //regex: /([a-z]+) < ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '<' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        tip: 'a < b\na меньше b',
        call: (args) => {
          return args[0].value < args[1].value
        }
      },
      {
        name: '>',
        style: 'infix',
        //regex: /([a-z]+) > ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '>' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        tip: 'a > b\na больше b',
        call: (args) => {
          return args[0].value > args[1].value
        }
      },
      {
        name: 'NOT',
        style: 'prefix',
        //regex: /NOT ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (o1 == 'NOT' && !isNaN(Number(o2))) {
            return {
              str: o1 + ' ' + o2,
              args: [Number(o2)]
            }
          } else return null;
        },
        tip: 'NOT a\nОтрицание условия a',
        call: (args) => {
          return !args[0].value
        }
      },
      {
        name: 'AND',
        style: 'infix',
        //regex: /([a-z]+) AND ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == 'AND' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        tip: 'a AND b\na и b истина одновременно',
        call: (args) => {
          return !!(args[0].value && args[1].value)
        }
      },
      {
        name: 'XOR',
        style: 'infix',
        //regex: /([a-z]+) XOR ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == 'XOR' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        tip: 'a XOR b\nИстина либо a, либо b, но не одновременно',
        call: (args) => {
          return !!(!args[0].value && args[1].value ||
            args[0].value && !args[1].value)
        }
      },
      {
        name: 'OR',
        style: 'infix',
        //regex: /([a-z]+) OR ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == 'OR' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        tip: 'a OR b\nИстина a или b или оба одновременно',
        call: (args) => {
          return !!(args[0].value || args[1].value)
        }
      }
    ]

    private static readonly dataExtractors = {
      isSimple: {
        accepts: 'edges',
        tip: 'Проверяет, является ли ребро простым (начальная и конечная вершины разные)',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.isSimple()
        }
      },
      isLoop: {
        accepts: 'edges',
        tip: 'Проверяет, является ли ребро петлей (начальная и конечная вершины одинаковы)',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.isLoop()
        }
      },
      isHidden: {
        accepts: 'any',
        tip: 'Проверяет, является ли элемент скрытым (позволяет исключить из поиска элементы, которые вы сделали невидимыми)',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.hasClass('hidden')
        }
      },
      degree: {
        accepts: 'nodes',
        tip: 'Возвращает степень вершины (количество входящих и выходящих ребер)',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.degree()
        }
      },
      inDegree: {
        accepts: 'nodes',
        tip: 'Возвращает количество входящих ребер',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.inDegree()
        }
      },
      outDegree: {
        accepts: 'nodes',
        tip: 'Возвращает количество выходящих ребер',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.outDegree()
        }
      }
    }

    private static readonly elementTypeTitles = {
      any: 'any\nВыбирать любые элементы, вершины или ребра',
      nodes: 'nodes\nВыбирать вершины',
      edges: 'edges\nВыбирать ребра'
    }

    /* ----------------------------------------------------------------------------------------------- */

    selectors = []
    operations = []
    strQuery = ''
    tree = {
      value: null
    }
    errors = []

    /*
    this.operations[operationIndex] = {
      type: 'selector',
      str: lexems[start] + ' ' + lexems[start + 1] + ' ' + lexems[start + 2] + ' ' + lexems[start + 3],
      returns: lexems[start + 1],
      condition: b,//lexems[start + 3],
      title: 'sdsdsd',
      value: null
    }
    this.selectors[b][variableNextIndex] = {
      type: 'condition',
      str: found.str,
      args: found.args,
      name: po.name,
      style: po.style,
      title: po.tip,
      calc: po.call.bind(this, this.selectors[b], args),
      value: null
    }
    this.selectors[selectorIndex][variableIndex] = {
      type: 'variable',
      str: `'${buffer}'`,
      variableType: '',
      title: 'dddd',
      get: (cytoscapeSingleElement) => {
        return stringConstantCopy
      },
      value: null
    }
    this.operations[operationIndex] = {
      type: 'collectionOperation',
      str: found.str,
      args: found.args,
      name: o.name,
      title: o.tip,
      calc: o.call.bind(this, this.operations, args),
      value: null
    }
     */
    execute(cytoscape) {
      //by design of parsing operations and conditions in each of selectors go in order of possibility to calculate
      for (let o of this.operations) {
        if (o.type == 'selector') {
          if (o.returns == 'nodes') {
            o.value = cytoscape.nodes()
          } else if (o.returns == 'edges') {
            o.value = cytoscape.edges()
          } else if (o.returns == 'any') {
            o.value = cytoscape.elements()
          }

          if (o.condition !== null) {
            let conditions = o.condition
            o.value = o.value.filter(function(ele, i, eles) {
              for (let condition of conditions) {
                if (condition.type == 'variable') {
                  condition.value = condition.get(ele)
                } else if (condition.type == 'condition') {
                  condition.value = condition.calc()
                }
              }
              let finalCondition = conditions[conditions.length - 1]
              return finalCondition.value
            })
          }
        } else if (o.type == 'collectionOperation') {
          o.value = o.calc()
        }
      }
      return this.tree.value
    }

    constructor(query: string) {
      this.strQuery = query
      if (!query) {
        console.warn(`SelectQuery constructor: provided empty query: ${query}`)
        //this.errors.push(`Provided empty query.`)
        this.errors.push(`Запрос пуст.`)
        return
      }

      const collectionOperators = SelectQuery.operators.map(o => o.name)
      const primitiveOperators = SelectQuery.primitiveOperators.map(o => o.name)
      const extractors = SelectQuery.dataExtractors

      let lexems = []
      let buffer = '', ch = ''
      let parenthesisCount = 0
      let isFieldNameOpened = false, isStringOpened = false
      let rootSelectParenthesisCount = -1
      let waitingForSelectType = false, waitingForWhere = false, waitingForCondition = false
      let currentSelectType = ''
      let selectBoundaries = []
      let variableIndex = 0, selectorIndex = -1
      
      for (let k = 0; k < query.length; k++) {
        ch = query[k]
        if (!isFieldNameOpened && !isStringOpened) {
          //we are outside
          if (ch.search(/[\s\(\)\'\`]/) >= 0 || k == query.length-1) {
            //got space, quote or parenthesis, check buffer

            if (k == query.length-1 && ch.search(/[\s\(\)\'\`]/) < 0) {
              buffer = buffer + ch
            }
            if (buffer.length > 0) {
              console.log('buffer:', buffer)
              let isKeyword = false
              if (waitingForCondition) {
                isKeyword = primitiveOperators.includes(buffer.toUpperCase())
              } else if (!waitingForSelectType && !waitingForWhere && !waitingForCondition) {
                isKeyword = collectionOperators.includes(buffer)
              }

              if (isKeyword) {
                lexems.push(buffer)
              } else {
                //not listed in keywords, maybe SELECT, WHERE, nodes, edges, any, isSimple, isLoop or isHidden?
                console.log('not keyword')
                if (buffer.toUpperCase() == 'SELECT') {
                  console.log('recognized SELECT')
                  if (waitingForSelectType || waitingForWhere || waitingForCondition) {
                    //this.errors.push(`Unexpected SELECT keyword at ${k - 6}. Nested SELECT queries aren't supported.`)
                    this.errors.push(`Непредвиденное ключевое слово SELECT на позиции ${k - 6}. Вложенные SELECT-запросы не поддерживаются.`)
                  } else if (k == query.length-1) {
                    //this.errors.push(`Unexpected end of query after SELECT keyword at ${k}.`)
                    this.errors.push(`Неожиданный конец запроса после ключевого слова SELECT на позиции ${k}.`)
                  } else {
                    if (ch.search(/\(\)\'\`/) >= 0) {
                      //this.errors.push(`Unexpected ${ch} at ${k} after SELECT keyword. An element type (nodes/edges/any) was expected.`)
                      this.errors.push(`Неожиданный символ ${ch} на позиции ${k} после ключевого слова SELECT. Ожидался тип элементов (nodes/edges/any).`)
                    } else {
                      lexems.push(buffer.toUpperCase())
                      rootSelectParenthesisCount = parenthesisCount
                      waitingForSelectType = true
                      selectBoundaries.push({})
                      selectBoundaries[selectBoundaries.length - 1].start = lexems.length - 1
                      this.selectors.push([])
                      selectorIndex++
                      variableIndex = 0
                    }
                  }

                } else if (buffer.toUpperCase() == 'WHERE') {
                  console.log('recognized WHERE')
                  if (waitingForWhere) {
                    if (ch == ')') {
                      //this.errors.push(`Unexpected closing parenthesis ) at ${k} after WHERE keyword. A condition was expected.`)
                      this.errors.push(`Неожиданная закрывающая скобка ) на позиции ${k} после ключевого слова WHERE. Ожидалось условие.`)
                    } else if (k == query.length-1) {
                      ///this.errors.push(`Unexpected end of query after WHERE keyword at ${k}.`)
                      this.errors.push(`Неожиданный конец запроса после ключевого слова WHERE на позиции ${k}.`)
                    } else {
                      lexems.push(buffer.toUpperCase())
                      waitingForWhere = false
                      waitingForCondition = true
                    }
                  } else {
                    if (waitingForCondition) {
                      //this.errors.push(`Unexpected WHERE keyword at ${k - 5}. It was already used in this SELECT query.`)
                      this.errors.push(`Непредвиденное ключевое слово WHERE на позиции ${k - 5}. Оно было уже использовано в этом SELECT-запросе.`)
                    } else if (waitingForSelectType) {
                      //this.errors.push(`Unexpected WHERE keyword at ${k - 5}. An element type (nodes/edges/any) was expected.`)
                      this.errors.push(`Непредвиденное ключевое слово WHERE на позиции ${k - 5}. Ожидался тип элементов (nodes/edges/any).`)
                    } else {
                      //this.errors.push(`Unexpected WHERE keyword at ${k - 5}. SELECT query wasn't opened.`)
                      this.errors.push(`Непредвиденное ключевое слово WHERE на позиции ${k - 5} вне SELECT-запроса.`)
                    }
                  }

                } else if (buffer == 'nodes' || buffer == 'edges' || buffer == 'any') {
                  console.log('recognized type of elements')
                  if (waitingForSelectType) {
                    if (ch.search(/\'\`\(/) >= 0) {
                      //this.errors.push(`Unexpected ${ch} at ${k} after element type ${buffer}. Either an end of SELECT query (with closing parenthesis ) ) or a WHERE keyword was expected.`)
                      this.errors.push(`Неожиданный символ ${ch} на позиции ${k} после типа элементов ${buffer}. Ожидался либо конец SELECT-запроса (с помощью закрывающей скобки ) ) или ключевое слово WHERE.`)
                    } else {
                      lexems.push(buffer)
                      currentSelectType = buffer
                      waitingForSelectType = false
                      waitingForWhere = true
                    }
                  } else {
                    if (waitingForWhere || waitingForCondition) {
                      //this.errors.push(`Unexpected ${buffer} keyword at ${k - buffer.length}. SELECT query already got an elements' type.`)
                      this.errors.push(`Непредвиденное ключевое слово ${buffer} на позиции ${k - buffer.length}. В этом SELECT-запросе уже задан тип элементов.`)
                    } else {
                      //this.errors.push(`Unexpected ${buffer} keyword at ${k - buffer.length}. SELECT query wasn't opened.`)
                      this.errors.push(`Непредвиденное ключевое слово ${buffer} на позиции ${k - buffer.length} вне SELECT-запроса.`)
                    }
                  }

                } else if (buffer in extractors) {
                  console.log('recognized extractor')
                  if (waitingForCondition) {
                    let extractor = extractors[buffer]
                    if (currentSelectType != extractor.accepts && extractor.accepts != 'any') {
                      //this.errors.push(`Invalid ${buffer} metadata property check at ${k - buffer.length}. You select elements of type ${currentSelectType}, while ${buffer} is only valid for type ${extractor.accepts}.`)
                      this.errors.push(`Неверная проверка метаданных ${buffer} на позиции ${k - buffer.length}. Этот SELECT-запрос выбирает элементы типа ${currentSelectType}, но ${buffer} проверяет только элементы типа ${extractor.accepts}.`)
                    }
                    this.selectors[selectorIndex][variableIndex] = {
                      type: 'variable',
                      str: buffer,
                      variableType: 'extractor',
                      get: extractor.get,
                      title: `${buffer}\n${extractor.tip}`,
                      value: null
                    }
                    lexems.push(variableIndex)
                    variableIndex++
                  } else {
                    if (waitingForSelectType || waitingForWhere) {
                      //this.errors.push(`Unexpected ${buffer} metadata property check at ${k - buffer.length}. It's only allowed in conditions after WHERE keyword.`)
                      this.errors.push(`Неверная проверка метаданных ${buffer} на позиции ${k - buffer.length}. Они разрешены только после ключевого слова WHERE.`)
                    } else {
                      //this.errors.push(`Unexpected ${buffer} metadata property check at ${k - buffer.length}. SELECT query wasn't opened.`)
                      this.errors.push(`Неверная проверка метаданных ${buffer} на позиции ${k - buffer.length} вне SELECT-запроса.`)
                    }
                  }

                } else if (!isNaN(Number(buffer))) {
                  console.log('recognized number constant')
                  let numberConstantCopy = Number(buffer)
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: buffer,
                    variableType: 'number',
                    get: (cytoscapeSingleElement) => {
                      return numberConstantCopy
                    },
                    title: `${buffer}\nЧисловая константа.${
                      (buffer == '0' || buffer == '1') ? ' NB: 0 и 1 не эквивалентны логическим FALSE и TRUE' : ''
                    }`,
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++

                } else if (buffer.toUpperCase() == 'TRUE') {
                  console.log('recognized TRUE')
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: 'TRUE',
                    variableType: 'boolean',
                    get: (cytoscapeSingleElement) => {
                      return true
                    },
                    title: 'TRUE\nЛогическая константа TRUE (истина). NB: числовая константа 1 не эквивалентна TRUE',
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++

                } else if (buffer.toUpperCase() == 'FALSE') {
                  console.log('recognized FALSE')
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: 'FALSE',
                    variableType: 'boolean',
                    get: (cytoscapeSingleElement) => {
                      return false
                    },
                    title: 'FALSE\nЛогическая константа FALSE (истина). NB: числовая константа 0 не эквивалентна FALSE',
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++

                /*} else if (buffer.toUpperCase() == 'NULL') {
                  console.log('recognized NULL')
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: 'NULL',
                    get: (cytoscapeSingleElement) => {
                      return null
                    },
                    title: `NULL\nКонстанта null. Обратите внимание, что null не равно пустому полю. Пустое поле (Javascript: null) (см. стандарт ECMAScript 2015)`,
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++*/

                } else {
                  //this.errors.push(`Unknown keyword ${buffer} at ${k - buffer.length}`)
                  this.errors.push(`Неизвестное ключевое слово ${buffer} на позиции ${k - buffer.length}`)
                }
              }
              buffer = ''
            }

            if (ch.search(/[\(\)\'\`]/) >= 0 || k == query.length-1) {
              //not a space
              if (ch == '(') {
                lexems.push(ch)
                parenthesisCount++
              } else if (ch == ')' || k == query.length-1) {
                if (ch == ')') {
                  lexems.push(ch)
                  parenthesisCount--
                  if (parenthesisCount < 0) {
                    //this.errors.push(`Unmatched closing parenthesis at ${k}`)
                    this.errors.push(`Непарная закрывающая скобка на позиции ${k}`)
                  }
                }
                if (parenthesisCount < rootSelectParenthesisCount || k == query.length-1) {
                  //with this ) we finished a SELECT query
                  console.log('end of lexem with char = ', ch, ', query end =', k == query.length-1)
                  if (k == query.length-1 && ch.search(/[\(\)\'\`]/) < 0) {
                    selectBoundaries[selectBoundaries.length - 1].end = lexems.length
                  } else {
                    selectBoundaries[selectBoundaries.length - 1].end = lexems.length - 1
                  }
                  rootSelectParenthesisCount = -1
                  currentSelectType = ''
                  waitingForCondition = false
                  waitingForWhere = false
                }
              } else if (ch == '\'') {
                //with this ' string constant is opened
                isStringOpened = true
              } else if (ch == '\`') {
                //with this ` string constant is opened
                isFieldNameOpened = true
              }
            }

          } else {
            //not a special character
            buffer += ch
          }
        } else if (isFieldNameOpened) {
          //we are inside field name
          if (ch == '`') {
            if (query[k+1] == '`') {
              k = k + 1
              buffer += '`'
            } else {
              let fieldNameCopy = buffer
              this.selectors[selectorIndex][variableIndex] = {
                type: 'variable',
                str: `\`${buffer}\``,
                variableType: 'property',
                get: (cytoscapeSingleElement) => {
                  return cytoscapeSingleElement.data(fieldNameCopy)
                },
                title: `\`${buffer}\`\nИмя поля класса или свободного свойства выбираемых элементов`,
                value: null
              }
              lexems.push(variableIndex)
              variableIndex++
              isFieldNameOpened = false
              buffer = ''
            }
          } else {
            buffer += ch
          }
          if (k == query.length-1) {
            //with this ) we finished a SELECT query
            console.log('end of lexem with char = ', ch, ', query end =', k == query.length-1)
            selectBoundaries[selectBoundaries.length - 1].end = lexems.length
            rootSelectParenthesisCount = -1
            currentSelectType = ''
            waitingForCondition = false
            waitingForWhere = false
          }
        } else if (isStringOpened) {
          //we are inside string constant
          if (ch == '\'') {
            if (query[k+1] == '\'') {
              k = k + 1
              buffer += '\''
            } else {
              if (!isNaN(new Date(buffer).getTime())) {
                //create constant date variable
                let date = new Date(buffer)
                this.selectors[selectorIndex][variableIndex] = {
                  type: 'variable',
                  str: `'${buffer}'`,
                  variableType: 'date',
                  get: (cytoscapeSingleElement) => {
                    return date
                  },
                  title: `'${buffer}'\nКонстанта типа дата-время`,
                  value: null
                }
                lexems.push(variableIndex)
                variableIndex++
                isStringOpened = false
                buffer = ''
              } else {
                //create constant string variable
                let stringConstantCopy = buffer
                this.selectors[selectorIndex][variableIndex] = {
                  type: 'variable',
                  str: `'${buffer}'`,
                  variableType: 'string',
                  get: (cytoscapeSingleElement) => {
                    return stringConstantCopy
                  },
                  title: `'${buffer}'\nСтроковая константа`,
                  value: null
                }
                lexems.push(variableIndex)
                variableIndex++
                isStringOpened = false
                buffer = ''
              }
            }
          } else {
            buffer += ch
          }
          if (k == query.length-1) {
            //with this ) we finished a SELECT query
            console.log('end of lexem with char = ', ch, ', query end =', k == query.length-1)
            selectBoundaries[selectBoundaries.length - 1].end = lexems.length
            rootSelectParenthesisCount = -1
            currentSelectType = ''
            waitingForCondition = false
            waitingForWhere = false
          }
        }
      }
      if (parenthesisCount > 0) {
        //this.errors.push(`Totally ${parenthesisCount} unmatched opening parenthesis.`)
        this.errors.push(`Всего ${parenthesisCount} непарных открывающих скобок.`)
      } else if (parenthesisCount < 0) {
        //this.errors.push(`Totally ${-parenthesisCount} unmatched closing parenthesis.`)
        this.errors.push(`Всего ${-parenthesisCount} непарных закрывающих скобок.`)
      }
      if (isStringOpened) {
        //this.errors.push(`Missing closing quote \' for a string or date constant.`)
        this.errors.push(`Пропущена закрывающая кавычка \' для строковой константы или даты.`)
      }
      if (isFieldNameOpened) {
        //this.errors.push(`Missing closing backquote \` for a field or free property name.`)
        this.errors.push(`Пропущен закрывающий обратный апостроф \` для имени поля или свободного свойства.`)
      }

      /* ---------------------------------------- Build relational queries trees ---------------------------------------- */

      console.log(`strQuery: ${query}, selectors: `, this.selectors, '; lexems:', lexems);
      
      let operationIndex = 0
      let shift = 0
      for (let b = 0; b < selectBoundaries.length; b++) {
        let bounds = selectBoundaries[b]
        let previousSelectLength = 0
        let start = bounds.start - shift
        let end = bounds.end - shift
        console.log(`Start simplifying SELECT at ${b}, start = ${start}, end = ${end}`)
        while ((end - start > 0) && (previousSelectLength != end - start)) {
          console.log(`not simplified yet. start = ${start}, end = ${end}, previousSelectLength = ${previousSelectLength} lexems = `, lexems)
          previousSelectLength = end - start

          if (previousSelectLength == 2) {
            console.log(`pushing short select at ${operationIndex}`)
            //let variableNextIndex = this.selectors[b].length
            operationIndex = b
            this.operations[operationIndex] = {
              type: 'selector',
              str: lexems[start] + ' ' + lexems[end - 1],
              returns: lexems[end - 1],
              condition: null,
              title: SelectQuery.elementTypeTitles[lexems[end - 1]],
              value: true
            }
            lexems.splice(start, 2, operationIndex)
            shift += 1

          } else if (previousSelectLength == 4) {
            console.log(`pushing select with condition at ${operationIndex}`)
            //let variableNextIndex = this.selectors[b].length
            operationIndex = b
            this.operations[operationIndex] = {
              type: 'selector',
              str: lexems[start] + ' ' + lexems[start + 1] + ' ' + lexems[start + 2] + ' ' + lexems[start + 3],
              returns: lexems[start + 1],
              //condition: b,//lexems[start + 3],
              title: SelectQuery.elementTypeTitles[lexems[start + 1]],
              condition: this.selectors[b],
              value: null
            }
            lexems.splice(start, 4, operationIndex)
            shift += 3

          } else {
            //simplify condition
            for (let po of SelectQuery.primitiveOperators) {
              for (let i = start + 1; i < end; i++) {
                console.log(`simplify condition. i = ${i}`, '; lexems: ', lexems)
                // (.) (*) (.); (.) (*) _
                console.log(`check ${lexems[i]} for ${po.name}`)
                let found = null
                if (i == end - 1) {
                  // operators like isNaN a, NOT a at the end of query
                  found = po.check(lexems[i-1], lexems[i], null)
                } else {
                  found = po.check(lexems[i-1], lexems[i], lexems[i+1])
                }
                if (found) {
                  let variableNextIndex = this.selectors[b].length
                  let args = found.args.map(index => this.selectors[b][index])
                  this.selectors[b][variableNextIndex] = {
                    type: 'condition',
                    str: found.str,
                    args: args,
                    name: po.name,
                    style: po.style,
                    title: po.tip,
                    calc: po.call.bind(this, args),
                    value: null
                  }
                  lexems.splice(i-1, found.args.length+1, variableNextIndex)
                  shift += found.args.length
                  end = end - found.args.length
                  i = i - found.args.length
                }
                if (lexems[i-1] == '(' && !isNaN(Number(lexems[i])) && lexems[i+1] == ')') {
                  let id = lexems[i]
                  lexems.splice(i-1, 3, id)
                  shift += 2
                  end = end - 2
                  i = i - 2
                }
              }
            }
          }
        }
      }
      
      console.log('\n---------------------\nFinished tree of SELECTs. lexems:', lexems,
      ' ; operations:', this.operations, '; selectors:', this.selectors);

      /* ----------------------------------- Build collection operations tree ------------------------------------- */

      operationIndex++;
      let previousLexemsLength = 0
      while (lexems.length != previousLexemsLength) {
        previousLexemsLength = lexems.length
        //simplify operation
        for (let i = 1; i < lexems.length; i++) {
          // (.) (*) (.); (.) (*) _
          for (let o of SelectQuery.operators) {
            let found = null
            if (i == lexems.length - 1) {
              // operators like isNaN a, NOT a at the end of query
              found = o.check(lexems[i-1], lexems[i], null)
            } else {
              found = o.check(lexems[i-1], lexems[i], lexems[i+1])
            }
            if (found) {
              let args = found.args.map(index => this.operations[index])
              if (o.accepts != 'any') {
                if (!args.every(a => a.returns == o.accepts)) {
                  //this.errors.push(`Type mismatch in ${found.str}. Operator ${o.name} accepts elements type ${o.accepts}, while arguments are of type ${args.map(a => a.returns)}`)
                  this.errors.push(`Несовпадение типов в ${found.str}. Оператор ${o.name} принимает тип элементов ${o.accepts}, но аргументы имеют типы ${args.map(a => a.returns)}`)
                }
              }
              this.operations[operationIndex] = {
                type: 'collectionOperation',
                str: found.str,
                args: args,
                name: o.name,
                title: o.tip,
                calc: o.call.bind(this, args),
                value: null
              }
              lexems.splice(i-1, found.args.length + 1, operationIndex)
              i = i - found.args.length
              operationIndex++
            }
          }
          if (lexems[i-1] == '(' && !isNaN(Number(lexems[i])) && lexems[i+1] == ')') {
            let id = lexems[i]
            lexems.splice(i-1, 3, id)
            i = i - 2
          }
        }
      }

      if (this.operations.length >= 1) {
        this.tree = this.operations[this.operations.length - 1]
      } else {
        console.warn('SelectQuery: no operations in query')
        //this.errors.push(`No operations found in query`)
        this.errors.push(`В запросе не найдено ни одной операции.`)
      }

      console.log('Finished. lexems:', lexems, '; operations:', this.operations, '; tree:',
      this.tree, '; selectors:', this.selectors, '; errors:', this.errors);
    }
  }