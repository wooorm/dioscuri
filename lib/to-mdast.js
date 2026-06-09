/**
 * @import {
 *   Blockquote as MdastBlockquote,
 *   Code as MdastCode,
 *   Heading as MdastHeading,
 *   ListItem as MdastListItem,
 *   List as MdastList,
 *   Nodes as MdastNodes,
 *   Paragraph as MdastParagraph,
 *   RootContent as MdastRootContent,
 *   Root as MdastRoot
 * } from 'mdast'
 * @import {Node as UnistNode} from 'unist'
 * @import {
 *   Break as GastBreak,
 *   Heading as GastHeading,
 *   Link as GastLink,
 *   ListItem as GastListItem,
 *   List as GastList,
 *   Nodes as GastNodes,
 *   Pre as GastPre,
 *   Quote as GastQuote,
 *   Root as GastRoot,
 *   Text as GastText
 * } from './gast.js'
 */

import {zwitch} from 'zwitch'

const transform = zwitch('type', {
  handlers: {
    break: handleBreak,
    heading,
    link,
    list,
    listItem,
    pre,
    quote,
    root,
    text
  },
  invalid,
  // @ts-expect-error: fine.
  unknown
})

/**
 * Turn gast into mdast.
 *
 * @param {GastNodes} node
 *   Gast node.
 * @returns {MdastNodes}
 *   Mdast node.
 */
export function toMdast(node) {
  return transform(node)
}

/**
 * @param {unknown} value
 */
function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

/**
 * @param {UnistNode} node
 */
function unknown(node) {
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

/**
 * @param {GastBreak} _
 * @return {undefined}
 */
function handleBreak(_) {
  // Empty.
}

/**
 * @param {GastHeading} node
 * @returns {MdastHeading}
 */
function heading(node) {
  const depth = /** @type {1 | 2 | 3} */ (
    Math.max(Math.min(3, node.rank || 1), 1)
  )

  return inherit(node, {
    type: 'heading',
    depth,
    children: node.value
      ? [position(node, {type: 'text', value: node.value})]
      : []
  })
}

/**
 * @param {GastLink} node
 * @returns {MdastParagraph}
 */
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

/**
 * @param {GastList} node
 * @returns {MdastList}
 */
function list(node) {
  const children = node.children || []
  /** @type {Array<MdastListItem>} */
  const results = []
  let index = -1

  while (++index < children.length) {
    // @ts-expect-error: assume list item.
    results.push(toMdast(children[index]))
  }

  return inherit(node, {
    type: 'list',
    ordered: false,
    spread: false,
    children:
      results.length > 0
        ? results
        : [{type: 'listItem', spread: false, children: []}]
  })
}

/**
 * @param {GastListItem} node
 * @returns {MdastListItem}
 */
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

/**
 * @param {GastPre} node
 * @returns {MdastCode}
 */
function pre(node) {
  /** @type {string | null} */
  let lang = null
  /** @type {string | null} */
  let meta = null

  if (node.alt) {
    const info = node.alt.replace(/^[ \t]+|[ \t]+$/g, '')
    const match = info.match(/[\t ]+/)
    if (match && match.index !== undefined) {
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

/**
 * @param {GastQuote} node
 * @returns {MdastBlockquote}
 */
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

/**
 * @param {GastRoot} node
 * @returns {MdastRoot}
 */
function root(node) {
  const children = node.children || []
  /** @type {Array<MdastRootContent>} */
  const results = []
  let index = -1

  while (++index < children.length) {
    /** @type {MdastRootContent|  undefined} */
    // @ts-expect-error: assume content.
    const value = toMdast(children[index])
    if (value) results.push(value)
  }

  return inherit(node, {type: 'root', children: results})
}

/**
 * @param {GastText} node
 * @returns {MdastParagraph | undefined}
 */
function text(node) {
  return node.value
    ? inherit(node, {
        type: 'paragraph',
        children: [position(node, {type: 'text', value: node.value})]
      })
    : undefined
}

/**
 * @template {MdastNodes} N
 * @param {GastNodes} left
 * @param {N} right
 * @returns {N}
 */
function inherit(left, right) {
  if (left.data) right.data = left.data
  return position(left, right)
}

/**
 * @template {MdastNodes} N
 * @param {GastNodes} left
 * @param {N} right
 * @returns {N}
 */
function position(left, right) {
  if (left.position) right.position = left.position
  return right
}
