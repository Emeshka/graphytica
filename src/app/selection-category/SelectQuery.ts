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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.union(operations[argIndeces[1]].value)
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.difference(operations[argIndeces[1]].value)
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.intersection(operations[argIndeces[1]].value)
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.openNeighborhood()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.closedNeighborhood()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.edgesWith(operations[argIndeces[1]].value)
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.edgesTo(operations[argIndeces[1]].value)
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.connectedNodes()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.connectedEdges()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.sources()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.targets()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.outgoers()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.successors()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.incomers()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.predecessors()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.roots()
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
        call: (operations, ...argIndeces) => {
          return operations[argIndeces[0]].value.leaves()
        }
      }
    ]

    private static readonly primitiveOperators = [
      {
        name: '=',
        //regex: /([a-z]+) = ([a-z]+)/g,
        check: (o1, o2, o3) => {
          if (!isNaN(Number(o1)) && o2 == '=' && !isNaN(Number(o3))) {
            return {
              str: o1 + ' ' + o2 + ' ' + o3,
              args: [Number(o1), Number(o3)]
            }
          } else return null;
        },
        tip: 'a = b\nРавенство a и b',
        call: (variables, ...argIndeces) => {
          return variables[argIndeces[0]].value === variables[argIndeces[1]].value
        }
      },
      {
        name: '<',
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
        call: (variables, ...argIndeces) => {
          return variables[argIndeces[0]].value < variables[argIndeces[1]].value
        }
      },
      {
        name: '>',
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
        call: (variables, ...argIndeces) => {
          return variables[argIndeces[0]].value > variables[argIndeces[1]].value
        }
      },
      {
        name: 'NOT',
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
        call: (conditions, ...argIndeces) => {
          return !conditions[argIndeces[0]].value
        }
      },
      {
        name: 'AND',
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
        call: (conditions, ...argIndeces) => {
          return !!(conditions[argIndeces[0]].value && conditions[argIndeces[1]].value)
        }
      },
      {
        name: 'XOR',
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
        call: (conditions, ...argIndeces) => {
          return !!(!conditions[argIndeces[0]].value && conditions[argIndeces[1]].value ||
            conditions[argIndeces[0]].value && !conditions[argIndeces[1]].value)
        }
      },
      {
        name: 'OR',
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
        call: (conditions, ...argIndeces) => {
          return !!(conditions[argIndeces[0]].value || conditions[argIndeces[1]].value)
        }
      }
    ]

    private static readonly dataExtractors = {
      isSimple: {
        accepts: 'edges',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.isSimple()
        }
      },
      isLoop: {
        accepts: 'edges',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.isLoop()
        }
      },
      isHidden: {
        accepts: 'any',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.hasClass('hidden')
        }
      },
      degree: {
        accepts: 'nodes',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.degree()
        }
      },
      inDegree: {
        accepts: 'nodes',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.inDegree()
        }
      },
      outDegree: {
        accepts: 'nodes',
        get: (cytoscapeSingleElement) => {
          return cytoscapeSingleElement.outDegree()
        }
      }
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
      value: null
    }
    this.selectors[b][variableNextIndex] = {
      type: 'condition',
      str: found.str,
      args: found.args,
      name: po.name,
      title: po.tip,
      calc: po.call.bind(this, this.selectors[b], found.args),
      value: null
    }
    this.selectors[selectorIndex][variableIndex] = {
      type: 'variable',
      str: `'${buffer}'`,
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
      calc: o.call.bind(this, this.operations, found.args),
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
            let conditions = this.selectors[o.conditions]
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

            if (buffer.length > 0) {
              if (k == query.length-1 && ch.search(/[\s\(\)\'\`]/) < 0) {
                buffer = buffer + ch
              }
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
                if (buffer.toUpperCase() == 'SELECT') {
                  if (waitingForSelectType || waitingForWhere || waitingForCondition) {
                    this.errors.push(`Unexpected SELECT keyword at ${k - 6}. Nested SELECT queries aren't supported.`)
                  } else if (k == query.length-1) {
                    this.errors.push(`Unexpected end of query after SELECT keyword at ${k}.`)
                  } else {
                    if (ch.search(/\(\)\'\`/) >= 0) {
                      this.errors.push(`Unexpected ${ch} at ${k} after SELECT keyword. An element type (nodes/edges/any) was expected.`)
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
                  if (waitingForWhere) {
                    if (ch == ')') {
                      this.errors.push(`Unexpected closing parenthesis ) at ${k} after WHERE keyword. A condition was expected.`)
                    } else if (k == query.length-1) {
                      this.errors.push(`Unexpected end of query after WHERE keyword at ${k}.`)
                    } else {
                      lexems.push(buffer.toUpperCase())
                      waitingForWhere = false
                      waitingForCondition = true
                    }
                  } else {
                    if (waitingForCondition) {
                      this.errors.push(`Unexpected WHERE keyword at ${k - 5}. It was already used in this SELECT query.`)
                    } else if (waitingForSelectType) {
                      this.errors.push(`Unexpected WHERE keyword at ${k - 5}. An element type (nodes/edges/any) was expected.`)
                    } else {
                      this.errors.push(`Unexpected WHERE keyword at ${k - 5}. SELECT query wasn't opened.`)
                    }
                  }

                } else if (buffer == 'nodes' || buffer == 'edges' || buffer == 'any') {
                  if (waitingForSelectType) {
                    if (ch.search(/\'\`\(/) >= 0) {
                      this.errors.push(`Unexpected ${ch} at ${k} after element type ${buffer}. Either an end of SELECT query (with closing parenthesis ) ) or a WHERE keyword was expected.`)
                    } else {
                      lexems.push(buffer)
                      currentSelectType = buffer
                      waitingForSelectType = false
                      waitingForWhere = true
                    }
                  } else {
                    if (waitingForWhere || waitingForCondition) {
                      this.errors.push(`Unexpected ${buffer} keyword at ${k - buffer.length}. SELECT query already got an elements' type.`)
                    } else {
                      this.errors.push(`Unexpected ${buffer} keyword at ${k - buffer.length}. SELECT query wasn't opened.`)
                    }
                  }

                } else if (buffer in extractors) {
                  if (waitingForCondition) {
                    let extractor = extractors[buffer]
                    if (currentSelectType != extractor.accepts && extractor.accepts != 'any') {
                      this.errors.push(`Invalid ${buffer} metadata property check at ${k - buffer.length}. You select elements of type ${currentSelectType}, while ${buffer} is only valid for type ${extractor.accepts}.`)
                    }
                    this.selectors[selectorIndex][variableIndex] = {
                      type: 'variable',
                      str: buffer,
                      get: extractor.get,
                      value: null
                    }
                    lexems.push(variableIndex)
                    variableIndex++
                  } else {
                    if (waitingForSelectType || waitingForWhere) {
                      this.errors.push(`Unexpected ${buffer} metadata property check at ${k - buffer.length}. It's only allowed in conditions after WHERE keyword.`)
                    } else {
                      this.errors.push(`Unexpected ${buffer} metadata property check at ${k - buffer.length}. SELECT query wasn't opened.`)
                    }
                  }

                } else if (!isNaN(Number(buffer))) {
                  let numberConstantCopy = Number(buffer)
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: buffer,
                    get: (cytoscapeSingleElement) => {
                      return numberConstantCopy
                    },
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++

                } else if (buffer.toUpperCase() == 'TRUE') {
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: 'TRUE',
                    get: (cytoscapeSingleElement) => {
                      return true
                    },
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++

                } else if (buffer.toUpperCase() == 'FALSE') {
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: 'FALSE',
                    get: (cytoscapeSingleElement) => {
                      return false
                    },
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++

                } else if (buffer.toUpperCase() == 'NULL') {
                  this.selectors[selectorIndex][variableIndex] = {
                    type: 'variable',
                    str: 'NULL',
                    get: (cytoscapeSingleElement) => {
                      return null
                    },
                    value: null
                  }
                  lexems.push(variableIndex)
                  variableIndex++

                } else {
                  this.errors.push(`Unknown keyword ${buffer} at ${k - buffer.length}`)
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
                    this.errors.push(`Unmatched closing parenthesis at ${k}`)
                  }
                }
                if (parenthesisCount < rootSelectParenthesisCount || k == query.length-1) {
                  //with this ) we finished a SELECT query
                  selectBoundaries[selectBoundaries.length - 1].end = k == query.length-1 ? lexems.length : lexems.length - 1
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
                get: (cytoscapeSingleElement) => {
                  return cytoscapeSingleElement.data(fieldNameCopy)
                },
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
        } else if (isStringOpened) {
          //we are inside string constant
          if (ch == '\'') {
            if (query[k+1] == '\'') {
              k = k + 1
              buffer += '\''
            } else {
              //create constant string variable
              let stringConstantCopy = buffer
              this.selectors[selectorIndex][variableIndex] = {
                type: 'variable',
                str: `'${buffer}'`,
                get: (cytoscapeSingleElement) => {
                  return stringConstantCopy
                },
                value: null
              }
              lexems.push(variableIndex)
              variableIndex++
              isStringOpened = false
              buffer = ''
            }
          } else {
            buffer += ch
          }
        }
      }
      if (parenthesisCount > 0) {
        this.errors.push(`Totally ${parenthesisCount} unmatched opening parenthesis`)
      } else if (parenthesisCount < 0) {
        this.errors.push(`Totally ${-parenthesisCount} unmatched closing parenthesis`)
      }
      if (isStringOpened) {
        this.errors.push(`Missing closing quote \' for a string constant`)
      }
      if (isFieldNameOpened) {
        this.errors.push(`Missing closing quote \` for a field name`)
      }

      /* ---------------------------------------- Build relational queries trees ---------------------------------------- */

      console.log(`strQuery: ${query}, selectors: `, this.selectors, '; lexems:', lexems);
      
      let operationIndex = 0
      let shift = 0
      for (let b = 0; b < selectBoundaries.length; b++) {
        console.log(b)
        let bounds = selectBoundaries[b]
        let previousSelectLength = 0
        let start = bounds.start - shift
        let end = bounds.end - shift
        while (previousSelectLength != end - start) {
          console.log(`not simplified yet. start = ${start}, end = ${end}, previousSelectLength = ${previousSelectLength} lexems = `, lexems)
          previousSelectLength = end - start

          if (previousSelectLength == 2) {
            console.log(`pushing short select at ${operationIndex}`)
            let variableNextIndex = this.selectors[b].length
            this.operations[operationIndex] = {
              type: 'selector',
              str: lexems[start] + ' ' + lexems[end - 1],
              returns: lexems[end - 1],
              condition: null,
              value: true
            }
            lexems.splice(start, 2, ''+variableNextIndex)
            shift += 1
            operationIndex++

          } else if (previousSelectLength == 4) {
            console.log(`pushing select with condition at ${operationIndex}`)
            let variableNextIndex = this.selectors[b].length
            this.operations[operationIndex] = {
              type: 'selector',
              str: lexems[start] + ' ' + lexems[start + 1] + ' ' + lexems[start + 2] + ' ' + lexems[start + 3],
              returns: lexems[start + 1],
              condition: b,//lexems[start + 3],
              value: null
            }
            lexems.splice(start, 4, ''+variableNextIndex)
            shift += 3
            operationIndex++

          } else {
            //simplify condition
            for (let i = start + 1; i < end; i++) {
              console.log(`simplify condition. i = ${i}`, '; lexems: ', lexems)
              // (.) (*) (.); (.) (*) _
              for (let po of SelectQuery.primitiveOperators) {
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
                  this.selectors[b][variableNextIndex] = {
                    type: 'condition',
                    str: found.str,
                    args: found.args,
                    name: po.name,
                    title: po.tip,
                    calc: po.call.bind(this, this.selectors[b], found.args),
                    value: null
                  }
                  lexems.splice(i-1, found.args.length+1, ''+variableNextIndex)
                  shift += found.args.length
                  end = end - found.args.length
                  i = i - found.args.length
                }
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
      
      console.log(`strQuery: ${query}, subs: ${this.operations.join('\n')}`);

      /* ----------------------------------- Build collection operations tree ------------------------------------- */

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
              if (o.accepts != 'any') {
                let args = found.args.map(index => this.operations[index])
                if (!args.every(a => a.returns == o.accepts)) {
                  this.errors.push(`Type mismatch in ${found.str}. Operator ${o.name} accepts elements type ${o.accepts}, while arguments are of type ${args.map(a => a.returns)}`)
                }
              }
              this.operations[operationIndex] = {
                type: 'collectionOperation',
                str: found.str,
                args: found.args,
                name: o.name,
                title: o.tip,
                calc: o.call.bind(this, this.operations, found.args),
                value: null
              }
              lexems.splice(i-1, found.args.length + 1, ''+operationIndex)
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

      this.tree = this.operations[this.operations.length - 1]

      console.log(`Finished. strQuery: ${query}, subs: ${this.operations.join('\n')}, tree:`,
      this.tree, ', selectors:', this.selectors, '; errors:', this.errors);
    }
  }