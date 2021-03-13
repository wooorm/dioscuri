import visit from 'unist-util-visit'
import {zwitch} from 'zwitch'

var own = {}.hasOwnProperty
var push = [].push

var handle = zwitch('type', {
  invalid: invalid,
  unknown: unknown,
  handlers: {
    blockquote: blockquote,
    break: hardBreak,
    code: code,
    definition: ignore,
    delete: ignore,
    emphasis: phrasing,
    footnote: footnote,
    footnoteDefinition: ignore,
    footnoteReference: footnoteReference,
    heading: heading,
    html: ignore,
    image: link,
    imageReference: linkReference,
    inlineCode: literal,
    link: link,
    linkReference: linkReference,
    list: list,
    listItem: listItem,
    paragraph: paragraph,
    root: root,
    strong: phrasing,
    table: table,
    tableCell: tableCell,
    tableRow: tableRow,
    text: literal,
    toml: ignore,
    thematicBreak: ignore,
    yaml: ignore
  }
})

export function fromMdast(tree, options) {
  var settings = options || {}
  var context = {
    tight: settings.tight,
    endlinks: settings.endlinks,
    dsvName: 'csv',
    dsvDelimiter: ',',
    defined: {definition: {}, footnoteDefinition: {}},
    queues: {link: [], footnote: []},
    link: 0,
    footnote: 0
  }

  visit(tree, ['definition', 'footnoteDefinition'], previsit)

  return handle(tree, context)

  function previsit(node) {
    var map = context.defined[node.type]
    var id = (node.identifier || '').toUpperCase()
    if (id && !own.call(map, id)) {
      map[id] = node
    }
  }
}

function blockquote(node, context) {
  return inherit(node, {type: 'quote', value: flow(node, context)})
}

function code(node) {
  var info = node.lang || null
  if (info && node.meta) info += ' ' + node.meta
  return inherit(node, {type: 'pre', alt: info, value: node.value || ''})
}

function hardBreak() {
  return ' '
}

function heading(node, context) {
  var rank = Math.max(node.depth || 1, 1)
  var value = phrasing(node, context)
  var result = inherit(
    node,
    rank < 4
      ? {type: 'heading', rank: rank, value: value}
      : value
      ? {type: 'text', value: value}
      : undefined
  )
  var flushed

  if (result) {
    flushed = flush(context)

    if (flushed.length) {
      result = [].concat(flushed, result)
    }
  }

  return result
}

function footnote(node, context) {
  return (
    '[' +
    toLetter(
      call(
        {
          children: [{type: 'paragraph', children: node.children}],
          position: node.position,
          data: node.data
        },
        context
      ).no
    ) +
    ']'
  )
}

function footnoteReference(node, context) {
  var id = (node.identifier || '').toUpperCase()
  var definition =
    id && own.call(context.defined.footnoteDefinition, id)
      ? context.defined.footnoteDefinition[id]
      : null

  return definition
    ? '[' + toLetter(call(definition, context).no) + ']'
    : undefined
}

function link(node, context) {
  return phrasing(node) + '[' + resource(node, context).no + ']'
}

function linkReference(node, context) {
  var id = (node.identifier || '').toUpperCase()
  var definition =
    id && own.call(context.defined.definition, id)
      ? context.defined.definition[id]
      : null
  return (
    phrasing(node) +
    (definition ? '[' + resource(definition, context).no + ']' : '')
  )
}

function list(node, context) {
  return inherit(node, {type: 'list', children: parent(node, context)})
}

function listItem(node, context) {
  var value = flow(node, context)

  if (typeof node.checked === 'boolean') {
    value = (node.checked ? '✓' : '✗') + (value ? ' ' + value : '')
  }

  return inherit(node, {type: 'listItem', value: value})
}

function paragraph(node, context) {
  var value = phrasing(node, context)
  return value ? inherit(node, {type: 'text', value: value}) : undefined
}

function root(node, context) {
  return inherit(node, {
    type: 'root',
    children: wrap(context, parent(node, context).concat(flush(context, true)))
  })
}

function table(node, context) {
  return inherit(node, {
    type: 'pre',
    alt: context.dsvName,
    value: parent(node, context).join('\n') || ''
  })
}

function tableCell(node, context) {
  var value = phrasing(node)

  return new RegExp('[\n\r"' + context.dsvDelimiter + ']').test(value)
    ? '"' + value.replace(/"/g, '""') + '"'
    : value
}

function tableRow(node, context) {
  return parent(node, context).join(context.dsvDelimiter)
}

function ignore() {}

function literal(node) {
  return node.value || ''
}

function flow(node, context) {
  var nodes = parent(node, context)
  var results = []
  var index = -1

  while (++index < nodes.length) {
    results[index] = nodes[index].value
  }

  return results.join('\n').replace(/\r?\n/g, ' ')
}

function phrasing(node, context) {
  return parent(node, context).join('').replace(/\r?\n/g, ' ')
}

function parent(node, context) {
  var children = node.children || []
  var results = []
  var index = -1
  var value

  while (++index < children.length) {
    value = handle(children[index], context)
    if (value) {
      if (typeof value === 'object' && 'length' in value) {
        push.apply(results, value)
      } else {
        results.push(value)
      }
    }
  }

  return results
}

function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

function unknown(node) {
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

function flush(context, atEnd) {
  var links = context.queues.link
  var footnotes = context.queues.footnote
  var result = []
  var index = -1
  var value

  if (!context.endlinks || atEnd) {
    while (++index < links.length) {
      value = '[' + links[index].no + ']'

      if (links[index].title) {
        value += ' ' + links[index].title
      }

      result.push(
        inherit(links[index], {
          type: 'link',
          url: links[index].url,
          value: value
        })
      )
    }

    links.length = 0
  }

  if (atEnd) {
    index = -1

    while (++index < footnotes.length) {
      value = flow(footnotes[index])
      value =
        '[' + toLetter(footnotes[index].no) + ']' + (value ? ' ' + value : '')
      result.push(inherit(footnotes[index], {type: 'text', value: value}))
    }
  }

  return result
}

function resource(node, context) {
  var queued = context.queues.link
  var url = node.url || '#'
  var title = node.title || ''
  var index = -1
  var result

  while (++index < queued.length) {
    if (queued[index].url === url && queued[index].title === title) {
      return queued[index]
    }
  }

  result = inherit(node, {url: url, title: title, no: ++context.link})
  queued.push(result)
  return result
}

function call(node, context) {
  var queued = context.queues.footnote
  var identifier = node.identifier || ''
  var index = -1
  var result

  if (identifier) {
    while (++index < queued.length) {
      if (queued[index].identifier === identifier) {
        return queued[index]
      }
    }
  }

  result = inherit(node, {
    identifier: identifier,
    children: node.children,
    no: ++context.footnote
  })
  queued.push(result)
  return result
}

function inherit(left, right) {
  if (left.data) right.data = left.data
  return position(left, right)
}

function position(left, right) {
  if (left.position) right.position = left.position
  return right
}

// 1 -> `a`, 26 -> `z`, 27 -> `aa`, …
function toLetter(value) {
  var result = ''
  var digit

  while (value) {
    digit = (value - 1) % 26
    result = String.fromCharCode(97 /* `a` */ + digit) + result
    value = Math.floor((value - digit) / 26)
  }

  return result
}

function wrap(context, nodes) {
  var index = -1
  var result

  if (!context.tight && nodes.length > 1) {
    result = [nodes[++index]]
    while (++index < nodes.length) {
      result.push({type: 'break'}, nodes[index])
    }

    return result
  }

  return nodes
}
