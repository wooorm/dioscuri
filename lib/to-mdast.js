import {zwitch} from 'zwitch'

var handle = zwitch('type', {
  invalid,
  unknown,
  handlers: {
    break: ignore,
    heading,
    link,
    list,
    listItem,
    pre,
    quote,
    root,
    text
  }
})

export function toMdast(tree) {
  return handle(tree)
}

function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

function unknown(node) {
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

function ignore() {}

function heading(node) {
  return inherit(node, {
    type: 'heading',
    depth: Math.max(Math.min(3, node.rank || 1), 1),
    children: node.value
      ? [position(node, {type: 'text', value: node.value})]
      : []
  })
}

function link(node) {
  return position(node, {
    type: 'paragraph',
    children: [
      inherit(node, {
        type: 'link',
        url: node.url || '',
        title: null,
        children: node.value
          ? [position(node, {type: 'text', value: node.value})]
          : []
      })
    ]
  })
}

function list(node) {
  var children = parent(node)
  return inherit(node, {
    type: 'list',
    ordered: false,
    spread: false,
    children: children.length
      ? children
      : [{type: 'listItem', spread: false, children: []}]
  })
}

function listItem(node) {
  return inherit(node, {
    type: 'listItem',
    spread: false,
    children: node.value
      ? [
          position(node, {
            type: 'paragraph',
            children: [position(node, {type: 'text', value: node.value})]
          })
        ]
      : []
  })
}

function pre(node) {
  var lang = null
  var meta = null
  var info
  var match

  if (node.alt) {
    info = node.alt.replace(/^[ \t]+|[ \t]+$/g, '')
    match = info.match(/[\t ]+/)
    if (match) {
      lang = info.slice(0, match.index)
      meta = info.slice(match.index + match[0].length)
    } else {
      lang = info
    }
  }

  return inherit(node, {
    type: 'code',
    lang,
    meta,
    value: node.value || ''
  })
}

function quote(node) {
  return inherit(node, {
    type: 'blockquote',
    children: node.value
      ? [
          position(node, {
            type: 'paragraph',
            children: [position(node, {type: 'text', value: node.value})]
          })
        ]
      : []
  })
}

function root(node) {
  return inherit(node, {type: 'root', children: parent(node)})
}

function text(node) {
  return node.value
    ? inherit(node, {
        type: 'paragraph',
        children: [position(node, {type: 'text', value: node.value})]
      })
    : undefined
}

function parent(node) {
  var children = node.children || []
  var results = []
  var index = -1
  var value

  while (++index < children.length) {
    value = handle(children[index])
    if (value) results.push(value)
  }

  return results
}

function inherit(left, right) {
  if (left.data) right.data = left.data
  return position(left, right)
}

function position(left, right) {
  if (left.position) right.position = left.position
  return right
}
