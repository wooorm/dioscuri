import repeat from 'repeat-string'
import {zwitch} from 'zwitch'

var handle = zwitch('type', {
  invalid,
  unknown,
  handlers: {
    break: hardBreak,
    heading,
    link,
    list,
    listItem,
    pre,
    quote,
    root,
    text: literal
  }
})

export function toGemtext(tree) {
  return handle(tree)
}

function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

function unknown(node) {
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

function hardBreak() {
  return '\n'
}

function heading(node) {
  var sequence = repeat('#', Math.max(Math.min(3, node.rank || 1), 1))
  var value = literal(node)
  return sequence + (value ? ' ' + value : '')
}

function link(node) {
  var text = literal(node)
  var value = '=>'

  if (node.url) {
    value += ' ' + node.url
    if (text) value += ' ' + text
  }

  return value
}

function list(node) {
  return parent(node) || '*'
}

function listItem(node) {
  var value = literal(node)
  return '*' + (value ? ' ' + value : '')
}

function pre(node) {
  var value = literal(node)
  return '```' + (node.alt || '') + (value ? '\n' + value : '') + '\n```'
}

function quote(node) {
  var value = literal(node)
  return '>' + (value ? ' ' + value : '')
}

function root(node) {
  var value = parent(node)

  if (value.length && value.charCodeAt(value.length - 1) !== 10 /* `\n` */) {
    value += '\n'
  }

  return value
}

function parent(node) {
  var children = node.children || []
  var results = []
  var index = -1
  var value

  while (++index < children.length) {
    value = handle(children[index])
    if (value) results.push(value === '\n' ? '' : value)
  }

  return results.join('\n')
}

function literal(node) {
  return node.value || ''
}
