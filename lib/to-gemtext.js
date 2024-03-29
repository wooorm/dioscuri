/**
 * @typedef {import('unist').Node} UnistNode
 *
 * @typedef {import('./gast.js').Link} Link
 * @typedef {import('./gast.js').Heading} Heading
 * @typedef {import('./gast.js').Text} Text
 * @typedef {import('./gast.js').Pre} Pre
 * @typedef {import('./gast.js').Root} Root
 * @typedef {import('./gast.js').List} List
 * @typedef {import('./gast.js').ListItem} ListItem
 * @typedef {import('./gast.js').Quote} Quote
 * @typedef {import('./gast.js').Break} Break
 * @typedef {import('./gast.js').Node} Node
 */

import {zwitch} from 'zwitch'

const handle = zwitch('type', {
  invalid,
  // @ts-expect-error: fine
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
 * Serialize gast.
 *
 * @param {Node} tree
 *   Node.
 * @returns {string}
 *   Document.
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
  const sequence = '#'.repeat(Math.max(Math.min(3, node.rank || 1), 1))
  const value = literal(node)
  return sequence + (value ? ' ' + value : '')
}

/**
 * @param {Link} node
 * @returns {string}
 */
function link(node) {
  const text = literal(node)
  let value = '=>'

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
  const value = literal(node)
  return '*' + (value ? ' ' + value : '')
}

/**
 * @param {Pre} node
 * @returns {string}
 */
function pre(node) {
  const value = literal(node)
  return '```' + (node.alt || '') + (value ? '\n' + value : '') + '\n```'
}

/**
 * @param {Quote} node
 * @returns {string}
 */
function quote(node) {
  const value = literal(node)
  return '>' + (value ? ' ' + value : '')
}

/**
 * @param {Root} node
 * @returns {string}
 */
function root(node) {
  let value = parent(node)

  if (
    value.length > 0 &&
    value.charCodeAt(value.length - 1) !== 10 /* `\n` */
  ) {
    value += '\n'
  }

  return value
}

/**
 * @param {List|Root} node
 * @returns {string}
 */
function parent(node) {
  const children = node.children || []
  /** @type {Array<string>} */
  const results = []
  let index = -1

  while (++index < children.length) {
    const value = /** @type {string} */ (handle(children[index]))
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
