/**
 * @typedef {import('./gtast.js').Node} Node
 * @typedef {import('./gtast.js').Link} Link
 * @typedef {import('./gtast.js').Heading} Heading
 * @typedef {import('./gtast.js').Text} Text
 * @typedef {import('./gtast.js').Pre} Pre
 * @typedef {import('./gtast.js').Root} Root
 * @typedef {import('./gtast.js').List} List
 * @typedef {import('./gtast.js').ListItem} ListItem
 * @typedef {import('./gtast.js').Quote} Quote
 * @typedef {import('./gtast.js').Break} Break
 *
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('unist').Position} UnistPosition
 * @typedef {import('unist').Data} UnistData
 */

// @ts-ignore
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

/**
 * @param {Root|List|Heading|Link|ListItem|Pre|Quote|Text|Break} tree
 * @returns {string}
 */
export function toGemtext(tree) {
  return handle(tree)
}

/**
 * @param {unknown} value
 * @returns {never}
 */
function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

/**
 * @param {UnistNode} node
 * @returns {never}
 */
function unknown(node) {
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

/**
 * @returns {string}
 */
function hardBreak() {
  return '\n'
}

/**
 * @param {Heading} node
 * @returns {string}
 */
function heading(node) {
  /** @type {string} */
  var sequence = repeat('#', Math.max(Math.min(3, node.rank || 1), 1))
  var value = literal(node)
  return sequence + (value ? ' ' + value : '')
}

/**
 * @param {Link} node
 * @returns {string}
 */
function link(node) {
  var text = literal(node)
  var value = '=>'

  if (node.url) {
    value += ' ' + node.url
    if (text) value += ' ' + text
  }

  return value
}

/**
 * @param {List} node
 * @returns {string}
 */
function list(node) {
  return parent(node) || '*'
}

/**
 * @param {ListItem} node
 * @returns {string}
 */
function listItem(node) {
  var value = literal(node)
  return '*' + (value ? ' ' + value : '')
}

/**
 * @param {Pre} node
 * @returns {string}
 */
function pre(node) {
  var value = literal(node)
  return '```' + (node.alt || '') + (value ? '\n' + value : '') + '\n```'
}

/**
 * @param {Quote} node
 * @returns {string}
 */
function quote(node) {
  var value = literal(node)
  return '>' + (value ? ' ' + value : '')
}

/**
 * @param {Root} node
 * @returns {string}
 */
function root(node) {
  var value = parent(node)

  if (value.length && value.charCodeAt(value.length - 1) !== 10 /* `\n` */) {
    value += '\n'
  }

  return value
}

/**
 * @param {List|Root} node
 * @returns {string}
 */
function parent(node) {
  var children = node.children || []
  /** @type {string[]} */
  var results = []
  var index = -1
  /** @type {string} */
  var value

  while (++index < children.length) {
    value = handle(children[index])
    if (value) results.push(value === '\n' ? '' : value)
  }

  return results.join('\n')
}

/**
 * @param {Heading|Link|ListItem|Pre|Quote|Text} node
 * @returns {string}
 */
function literal(node) {
  return node.value || ''
}
