/**
 * @typedef {import('./gtast.js').Node} GtastNode
 * @typedef {import('./gtast.js').Link} GtastLink
 * @typedef {import('./gtast.js').Heading} GtastHeading
 * @typedef {import('./gtast.js').Text} GtastText
 * @typedef {import('./gtast.js').Pre} GtastPre
 * @typedef {import('./gtast.js').Root} GtastRoot
 * @typedef {import('./gtast.js').List} GtastList
 * @typedef {import('./gtast.js').ListItem} GtastListItem
 * @typedef {import('./gtast.js').Quote} GtastQuote
 * @typedef {import('./gtast.js').Break} GtastBreak
 *
 * @typedef {import('mdast').Literal} MdastLiteral
 * @typedef {import('mdast').Blockquote} MdastBlockquote
 * @typedef {import('mdast').Break} MdastBreak
 * @typedef {import('mdast').Content} MdastContent
 * @typedef {import('mdast').Code} MdastCode
 * @typedef {import('mdast').Definition} MdastDefinition
 * @typedef {import('mdast').Delete} MdastDelete
 * @typedef {import('mdast').Emphasis} MdastEmphasis
 * @typedef {import('mdast').Heading} MdastHeading
 * @typedef {import('mdast').HTML} MdastHtml
 * @typedef {import('mdast').Footnote} MdastFootnote
 * @typedef {import('mdast').FootnoteDefinition} MdastFootnoteDefinition
 * @typedef {import('mdast').FootnoteReference} MdastFootnoteReference
 * @typedef {import('mdast').Image} MdastImage
 * @typedef {import('mdast').ImageReference} MdastImageReference
 * @typedef {import('mdast').InlineCode} MdastInlineCode
 * @typedef {import('mdast').Link} MdastLink
 * @typedef {import('mdast').LinkReference} MdastLinkReference
 * @typedef {import('mdast').List} MdastList
 * @typedef {import('mdast').ListItem} MdastListItem
 * @typedef {import('mdast').Paragraph} MdastParagraph
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('mdast').Strong} MdastStrong
 * @typedef {import('mdast').Table} MdastTable
 * @typedef {import('mdast').TableCell} MdastTableCell
 * @typedef {import('mdast').TableRow} MdastTableRow
 * @typedef {import('mdast').Text} MdastText
 * @typedef {import('mdast').ThematicBreak} MdastThematicBreak
 * @typedef {import('mdast').YAML} MdastYaml
 *
 * @typedef {MdastRoot|MdastContent} MdastNode
 *
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('unist').Position} UnistPosition
 * @typedef {import('unist').Data} UnistData
 *
 * @typedef {{[name: string]: unknown, position?: UnistPosition}} AcceptsPosition
 * @typedef {{[name: string]: unknown, data?: UnistData}} AcceptsData
 */

import {zwitch} from 'zwitch'

export const toMdast = zwitch('type', {
  handlers: {
    // @ts-expect-error: fine.
    break: handleBreak,
    // @ts-expect-error: fine.
    heading,
    // @ts-expect-error: fine.
    link,
    // @ts-expect-error: fine.
    list,
    // @ts-expect-error: fine.
    listItem,
    // @ts-expect-error: fine.
    pre,
    // @ts-expect-error: fine.
    quote,
    // @ts-expect-error: fine.
    root,
    // @ts-expect-error: fine.
    text
  },
  invalid,
  // @ts-expect-error: fine.
  unknown
})

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
 * @param {GtastBreak} _
 * @return {void}
 */
function handleBreak(_) {}

/**
 * @param {GtastHeading} node
 * @returns {MdastHeading}
 */
function heading(node) {
  const depth = /** @type {1|2|3} */ (Math.max(Math.min(3, node.rank || 1), 1))

  return inherit(node, {
    type: 'heading',
    depth,
    children: node.value
      ? [position(node, {type: 'text', value: node.value})]
      : []
  })
}

/**
 * @param {GtastLink} node
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
 * @param {GtastList} node
 * @returns {MdastList}
 */
function list(node) {
  const children = node.children || []
  /** @type {MdastListItem[]} */
  const results = []
  let index = -1

  while (++index < children.length) {
    // @ts-expect-error too many overloads
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
 * @param {GtastListItem} node
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
 * @param {GtastPre} node
 * @returns {MdastCode}
 */
function pre(node) {
  /** @type {string|null} */
  let lang = null
  /** @type {string|null} */
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
 * @param {GtastQuote} node
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
 * @param {GtastRoot} node
 * @returns {MdastRoot}
 */
function root(node) {
  const children = node.children || []
  /** @type {MdastContent[]} */
  const results = []
  let index = -1

  while (++index < children.length) {
    /** @type {MdastContent|undefined} */
    // @ts-expect-error: too many overloads.
    const value = toMdast(children[index])
    if (value) results.push(value)
  }

  return inherit(node, {type: 'root', children: results})
}

/**
 * @param {GtastText} node
 * @returns {MdastParagraph|undefined}
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
 * @template {MdastNode} N
 * @param {GtastNode} left
 * @param {N} right
 * @returns {N}
 */
function inherit(left, right) {
  if (left.data) right.data = left.data
  return position(left, right)
}

/**
 * @template {MdastNode} N
 * @param {GtastNode} left
 * @param {N} right
 * @returns {N}
 */
function position(left, right) {
  if (left.position) right.position = left.position
  return right
}
