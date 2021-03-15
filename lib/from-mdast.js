import visit from 'unist-util-visit'
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
 * @typedef MdastTomlFields
 * @property {'toml'} type
 * @typedef {MdastLiteral & MdastTomlFields} MdastToml
 *
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('unist').Position} UnistPosition
 * @typedef {import('unist').Data} UnistData
 *
 * @typedef {{[name: string]: unknown, position?: UnistPosition}} AcceptsPosition
 * @typedef {{[name: string]: unknown, data?: UnistData}} AcceptsData
 *
 * @typedef Options
 * @property {boolean} [tight=false]
 * @property {boolean} [endlinks=false]
 *
 * @typedef Defined
 * @property {Record.<string, MdastDefinition>} definition
 * @property {Record.<string, MdastFootnoteDefinition>} footnoteDefinition
 *
 * @typedef LinkLike
 * @property {string} url
 * @property {string?} title
 * @property {number} no
 *
 * @typedef FootnoteDefinitionWithNumberFields
 * @property {number} no
 * @typedef {MdastFootnoteDefinition & FootnoteDefinitionWithNumberFields} FootnoteDefinitionWithNumber
 *
 * @typedef Queues
 * @property {LinkLike[]} link
 * @property {FootnoteDefinitionWithNumber[]} footnote
 *
 * @typedef Context
 * @property {boolean} tight
 * @property {boolean} endlinks
 * @property {'csv'} dsvName
 * @property {','} dsvDelimiter
 * @property {Defined} defined
 * @property {Queues} queues
 * @property {number} link
 * @property {number} footnote
 */

var own = {}.hasOwnProperty
var push = [].push

/** @type {{
 *   (node: MdastBlockquote, context: Context): GtastQuote
 *   (node: MdastBreak, context: Context): string
 *   (node: MdastCode, context: Context): GtastPre
 *   (node: MdastDefinition, context: Context): void
 *   (node: MdastDelete, context: Context): void
 *   (node: MdastEmphasis, context: Context): string
 *   (node: MdastFootnote, context: Context): string
 *   (node: MdastFootnoteDefinition, context: Context): void
 *   (node: MdastFootnoteReference, context: Context): string | undefined
 *   (node: MdastHeading, context: Context): Array.<GtastHeading | GtastText | GtastLink> | undefined
 *   (node: MdastHtml, context: Context): void
 *   (node: MdastImage, context: Context): string
 *   (node: MdastImageReference, context: Context): string
 *   (node: MdastInlineCode, context: Context): string
 *   (node: MdastLink, context: Context): string
 *   (node: MdastLinkReference, context: Context): string
 *   (node: MdastList, context: Context): GtastList
 *   (node: MdastListItem, context: Context): GtastListItem
 *   (node: MdastParagraph, context: Context): GtastText | undefined
 *   (node: MdastRoot, context: Context): GtastRoot
 *   (node: MdastStrong, context: Context): string
 *   (node: MdastTable, context: Context): GtastPre
 *   (node: MdastTableCell, context: Context): string
 *   (node: MdastTableRow, context: Context): string
 *   (node: MdastText, context: Context): string
 *   (node: MdastThematicBreak, context: Context): void
 *   (node: MdastToml, context: Context): void
 *   (node: MdastYaml, context: Context): void
 * }} */
// @ts-ignore
var handle = zwitch('type', {
  invalid,
  unknown,
  handlers: {
    blockquote,
    break: hardBreak,
    code,
    definition: ignore,
    delete: ignore,
    emphasis: phrasing,
    footnote,
    footnoteDefinition: ignore,
    footnoteReference,
    heading,
    html: ignore,
    image: link,
    imageReference: linkReference,
    inlineCode: literal,
    link,
    linkReference,
    list,
    listItem,
    paragraph,
    root,
    strong: phrasing,
    table,
    tableCell,
    tableRow,
    text: literal,
    toml: ignore,
    thematicBreak: ignore,
    yaml: ignore
  }
})

/**
 * @param {MdastContent} tree
 * @param {Options} [options]
 * @returns {GtastNode|string|undefined}
 */
export function fromMdast(tree, options) {
  var settings = options || {}
  /** @type {Context} */
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

  /**
   * @param {MdastDefinition|MdastFootnoteDefinition} node
   */
  function previsit(node) {
    var map = context.defined[node.type]
    var id = (node.identifier || '').toUpperCase()
    if (id && !own.call(map, id)) {
      map[id] = node
    }
  }
}

/**
 * @param {MdastBlockquote} node
 * @param {Context} context
 * @returns {GtastQuote}
 */
function blockquote(node, context) {
  return inherit(node, {type: 'quote', value: flow(node, context)})
}

/**
 * @param {MdastCode} node
 * @returns {GtastPre}
 */
function code(node) {
  var info = node.lang || null
  if (info && node.meta) info += ' ' + node.meta
  return inherit(node, {type: 'pre', alt: info, value: node.value || ''})
}

/**
 * @returns {string}
 */
function hardBreak() {
  return ' '
}

/**
 * @param {MdastHeading} node
 * @param {Context} context
 * @returns {Array.<GtastHeading | GtastText | GtastLink>?}
 */
function heading(node, context) {
  var rank = Math.max(node.depth || 1, 1)
  var value = phrasing(node, context)
  var result =
    rank < 4
      ? inherit(node, {type: 'heading', rank, value})
      : value
      ? inherit(node, {type: 'text', value})
      : undefined

  if (result) {
    return [].concat(flush(context), result)
  }
}

/**
 * @param {MdastFootnote} node
 * @param {Context} context
 * @returns {string}
 */
function footnote(node, context) {
  return (
    '[' +
    toLetter(
      call(
        inherit(node, {
          type: 'footnoteDefinition',
          identifier: '',
          children: [{type: 'paragraph', children: node.children}]
        }),
        context
      ).no
    ) +
    ']'
  )
}

/**
 * @param {MdastFootnoteReference} node
 * @param {Context} context
 * @returns {string?}
 */
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

/**
 * @param {MdastLink} node
 * @param {Context} context
 * @returns {string}
 */
function link(node, context) {
  return phrasing(node, context) + '[' + resource(node, context).no + ']'
}

/**
 * @param {MdastLinkReference} node
 * @param {Context} context
 * @returns {string}
 */
function linkReference(node, context) {
  var id = (node.identifier || '').toUpperCase()
  var definition =
    id && own.call(context.defined.definition, id)
      ? context.defined.definition[id]
      : null
  return (
    phrasing(node, context) +
    (definition ? '[' + resource(definition, context).no + ']' : '')
  )
}

/**
 * @param {MdastList} node
 * @param {Context} context
 * @returns {GtastList}
 */
function list(node, context) {
  // @ts-ignore always valid content.
  return inherit(node, {
    type: 'list',
    children: parentOfNodes(node, context)
  })
}

/**
 * @param {MdastListItem} node
 * @param {Context} context
 * @returns {GtastListItem}
 */
function listItem(node, context) {
  var value = flow(node, context)

  if (typeof node.checked === 'boolean') {
    value = (node.checked ? '✓' : '✗') + (value ? ' ' + value : '')
  }

  return inherit(node, {type: 'listItem', value})
}

/**
 * @param {MdastParagraph} node
 * @param {Context} context
 * @returns {GtastText?}
 */
function paragraph(node, context) {
  var value = phrasing(node, context)
  return value ? inherit(node, {type: 'text', value}) : undefined
}

/**
 * @param {MdastRoot} node
 * @param {Context} context
 * @returns {GtastRoot}
 */
function root(node, context) {
  // @ts-ignore always valid content.
  return inherit(node, {
    type: 'root',
    children: wrap(
      context,
      parentOfNodes(node, context).concat(flush(context, true))
    )
  })
}

/**
 * @param {MdastTable} node
 * @param {Context} context
 * @returns {GtastPre}
 */
function table(node, context) {
  return inherit(node, {
    type: 'pre',
    alt: context.dsvName,
    value: parentOfStrings(node, context).join('\n') || ''
  })
}

/**
 * @param {MdastTableCell} node
 * @param {Context} context
 * @returns {string}
 */
function tableCell(node, context) {
  var value = phrasing(node, context)

  return new RegExp('[\n\r"' + context.dsvDelimiter + ']').test(value)
    ? '"' + value.replace(/"/g, '""') + '"'
    : value
}

/**
 * @param {MdastTableRow} node
 * @param {Context} context
 * @returns {string}
 */
function tableRow(node, context) {
  return parentOfStrings(node, context).join(context.dsvDelimiter)
}

function ignore() {}

/**
 * @param {MdastLiteral} node
 */
function literal(node) {
  return node.value || ''
}

/**
 * @param {MdastBlockquote|MdastListItem|MdastFootnoteDefinition} node
 * @param {Context} context
 * @returns {string}
 */
function flow(node, context) {
  var nodes = parentOfNodes(node, context)
  /** @type {string[]} */
  var results = []
  var index = -1

  while (++index < nodes.length) {
    // @ts-ignore always valid content.
    results.push(nodes[index].value)
  }

  return results.join('\n').replace(/\r?\n/g, ' ')
}

/**
 * @param {MdastHeading|MdastLink|MdastLinkReference|MdastParagraph|MdastTableCell} node
 * @param {Context} context
 * @returns {string}
 */
function phrasing(node, context) {
  return parentOfStrings(node, context).join('').replace(/\r?\n/g, ' ')
}

/**
 * @param {MdastTable|MdastTableRow|MdastHeading|MdastLink|MdastLinkReference|MdastParagraph|MdastTableCell} node
 * @param {Context} context
 * @returns {string[]}
 */
function parentOfStrings(node, context) {
  var children = node.children || []
  /** @type {string[]} */
  var results = []
  var index = -1
  /** @type {string|string[]|undefined} */
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

/**
 * @param {MdastRoot|MdastList|MdastBlockquote|MdastListItem|MdastFootnoteDefinition} node
 * @param {Context} context
 * @returns {Array.<GtastNode>}
 */
function parentOfNodes(node, context) {
  var children = node.children || []
  /** @type {GtastNode[]} */
  var results = []
  var index = -1
  /** @type {GtastNode|GtastNode[]|undefined} */
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
 * @param {Context} context
 * @param {boolean} [atEnd=false]
 * @returns {Array.<GtastLink | GtastText>}
 */
function flush(context, atEnd) {
  var links = context.queues.link
  var footnotes = context.queues.footnote
  /** @type {Array.<GtastLink | GtastText>} */
  var result = []
  var index = -1
  /** @type {string} */
  var value

  if (!context.endlinks || atEnd) {
    while (++index < links.length) {
      value = '[' + links[index].no + ']'

      if (links[index].title) {
        value += ' ' + links[index].title
      }

      result.push(
        inherit(links[index], {type: 'link', url: links[index].url, value})
      )
    }

    links.length = 0
  }

  if (atEnd) {
    index = -1

    while (++index < footnotes.length) {
      value = flow(footnotes[index], context)
      value =
        '[' + toLetter(footnotes[index].no) + ']' + (value ? ' ' + value : '')
      result.push(inherit(footnotes[index], {type: 'text', value}))
    }
  }

  return result
}

/**
 * @param {{[name: string]: unknown, url?: string, title?: string}} node
 * @param {Context} context
 * @returns {LinkLike}
 */
function resource(node, context) {
  var queued = context.queues.link
  var url = node.url || '#'
  var title = node.title || ''
  var index = -1
  /** @type {LinkLike} */
  var result

  while (++index < queued.length) {
    if (queued[index].url === url && queued[index].title === title) {
      return queued[index]
    }
  }

  result = inherit(node, {url, title, no: ++context.link})
  queued.push(result)
  return result
}

/**
 * @param {MdastFootnoteDefinition} node
 * @param {Context} context
 * @returns {FootnoteDefinitionWithNumber}
 */
function call(node, context) {
  var queued = context.queues.footnote
  var identifier = node.identifier || ''
  var index = -1
  /** @type {FootnoteDefinitionWithNumber} */
  var result

  if (identifier) {
    while (++index < queued.length) {
      if (queued[index].identifier === identifier) {
        return queued[index]
      }
    }
  }

  result = inherit(node, {
    type: 'footnoteDefinition',
    identifier: '',
    children: node.children || [],
    no: ++context.footnote
  })
  queued.push(result)
  return result
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

/**
 * 1 -> `a`, 26 -> `z`, 27 -> `aa`, …
 *
 * @param {number} value
 * @returns {string}
 */
function toLetter(value) {
  var result = ''
  /** @type {number} */
  var digit

  while (value) {
    digit = (value - 1) % 26
    result = String.fromCharCode(97 /* `a` */ + digit) + result
    value = Math.floor((value - digit) / 26)
  }

  return result
}

/**
 * @param {Context} context
 * @param {GtastNode[]} nodes
 * @returns {GtastNode[]}
 */
function wrap(context, nodes) {
  var index = -1
  /** @type {GtastNode[]} */
  var result

  if (context.tight || nodes.length < 1) {
    return nodes
  }

  result = [nodes[++index]]
  while (++index < nodes.length) {
    result.push({type: 'break'}, nodes[index])
  }

  return result
}
