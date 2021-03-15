import {zwitch} from 'zwitch'

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
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('unist').Position} UnistPosition
 * @typedef {import('unist').Data} UnistData
 *
 * @typedef {{[name: string]: unknown, position?: UnistPosition}} AcceptsPosition
 * @typedef {{[name: string]: unknown, data?: UnistData}} AcceptsData
 */

/** @type {{
 *   (node: GtastBreak): void
 *   (node: GtastHeading): MdastHeading
 *   (node: GtastLink): MdastParagraph
 *   (node: GtastList): MdastList
 *   (node: GtastListItem): MdastListItem
 *   (node: GtastPre): MdastCode
 *   (node: GtastQuote): MdastBlockquote
 *   (node: GtastRoot): MdastRoot
 *   (node: GtastText): MdastParagraph | void
 * }} */
// @ts-ignore
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

/**
 * @param {GtastBreak|GtastHeading|GtastLink|GtastList|GtastListItem|GtastPre|GtastQuote|GtastRoot|GtastText} tree
 */
export function toMdast(tree) {
  return handle(tree)
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

function ignore() {}

/**
 * @param {GtastHeading} node
 * @returns {MdastHeading}
 */
function heading(node) {
  // @ts-ignore yes, that number is `1 | 2 | 3`.
  return inherit(node, {
    type: 'heading',
    depth: Math.max(Math.min(3, node.rank || 1), 1),
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
  var children = node.children || []
  /** @type {MdastListItem[]} */
  var results = []
  var index = -1

  while (++index < children.length) {
    results.push(handle(children[index]))
  }

  return inherit(node, {
    type: 'list',
    ordered: false,
    spread: false,
    children: results.length
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
  /** @type {string?} */
  var lang = null
  /** @type {string?} */
  var meta = null
  /** @type {string} */
  var info
  /** @type {RegExpMatchArray} */
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
  var children = node.children || []
  /** @type {MdastContent[]} */
  var results = []
  var index = -1
  /** @type {MdastContent} */
  var value

  while (++index < children.length) {
    value = handle(children[index])
    if (value) results.push(value)
  }

  return inherit(node, {type: 'root', children: results})
}

/**
 * @param {GtastText} node
 * @returns {MdastParagraph?}
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
 * @template {AcceptsData} N
 * @param {AcceptsData} left
 * @param {N} right
 * @returns {N}
 */
function inherit(left, right) {
  if (left.data) right.data = left.data
  return position(left, right)
}

/**
 * @template {AcceptsPosition} N
 * @param {AcceptsPosition} left
 * @param {N} right
 * @returns {N}
 */
function position(left, right) {
  if (left.position) right.position = left.position
  return right
}
