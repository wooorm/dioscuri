/**
 * @typedef {import('./gast.js').Node} GastNode
 * @typedef {import('./gast.js').Content} GastContent
 * @typedef {import('./gast.js').Link} GastLink
 * @typedef {import('./gast.js').Heading} GastHeading
 * @typedef {import('./gast.js').Text} GastText
 * @typedef {import('./gast.js').Pre} GastPre
 * @typedef {import('./gast.js').Root} GastRoot
 * @typedef {import('./gast.js').RootContent} GastRootContent
 * @typedef {import('./gast.js').List} GastList
 * @typedef {import('./gast.js').ListItem} GastListItem
 * @typedef {import('./gast.js').Quote} GastQuote
 *
 * @typedef {import('mdast').Literal} MdastLiteral
 * @typedef {import('mdast').Blockquote} MdastBlockquote
 * @typedef {import('mdast').Content} MdastContent
 * @typedef {import('mdast').Code} MdastCode
 * @typedef {import('mdast').Definition} MdastDefinition
 * @typedef {import('mdast').Heading} MdastHeading
 * @typedef {import('mdast').Footnote} MdastFootnote
 * @typedef {import('mdast').FootnoteDefinition} MdastFootnoteDefinition
 * @typedef {import('mdast').FootnoteReference} MdastFootnoteReference
 * @typedef {import('mdast').Link} MdastLink
 * @typedef {import('mdast').LinkReference} MdastLinkReference
 * @typedef {import('mdast').List} MdastList
 * @typedef {import('mdast').ListItem} MdastListItem
 * @typedef {import('mdast').Paragraph} MdastParagraph
 * @typedef {import('mdast').Resource} MdastResource
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('mdast').Table} MdastTable
 * @typedef {import('mdast').TableRow} MdastTableRow
 * @typedef {import('mdast').TableCell} MdastTableCell
 *
 * @typedef {MdastContent|MdastRoot} MdastNode
 *
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 *
 * @typedef Defined
 * @property {Record<string, MdastDefinition>} definition
 * @property {Record<string, MdastFootnoteDefinition>} footnoteDefinition
 *
 * @typedef LinkLikeFields
 * @property {'link-like'} type
 * @property {string} url
 * @property {string|null} [title]
 * @property {number} no
 *
 * @typedef {UnistNode & LinkLikeFields} LinkLike
 *
 * @typedef FootnoteDefinitionWithNumberFields
 * @property {number} no
 *
 * @typedef {MdastFootnoteDefinition & FootnoteDefinitionWithNumberFields} FootnoteDefinitionWithNumber
 *
 * @typedef Queues
 * @property {Array<LinkLike>} link
 * @property {Array<FootnoteDefinitionWithNumber>} footnote
 *
 * @typedef Context
 * @property {boolean|undefined} tight
 * @property {boolean|undefined} endlinks
 * @property {'csv'} dsvName
 * @property {','} dsvDelimiter
 * @property {Defined} defined
 * @property {Queues} queues
 * @property {number} link
 * @property {number} footnote
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {boolean} [tight=false]
 *   Do not put blank lines between blocks.
 *   The default is to place breaks between each block (paragraph, heading, etc).
 * @property {boolean} [endlinks=false]
 *   Place links at the end of the document.
 *   The default is to place links before the next heading.
 */

import {visit} from 'unist-util-visit'
import {zwitch} from 'zwitch'

const own = {}.hasOwnProperty

const transform = zwitch('type', {
  invalid,
  // @ts-expect-error: fine.
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
 * @param {MdastNode} node
 * @param {Context} context
 * @returns {Array<GastContent>|GastNode|string|void}
 */
function handle(node, context) {
  return transform(node, context)
}

/**
 * Transform mdast to gast.
 *
 * @param {MdastNode} tree
 *   mdast tree.
 * @param {Options} [options]
 *   Configuration (optional).
 * @returns {Array<GastContent>|GastNode|string|void}
 */
export function fromMdast(tree, options) {
  const settings = options || {}
  /** @type {Context} */
  const context = {
    tight: settings.tight,
    endlinks: settings.endlinks,
    dsvName: 'csv',
    dsvDelimiter: ',',
    defined: {definition: {}, footnoteDefinition: {}},
    queues: {link: [], footnote: []},
    link: 0,
    footnote: 0
  }

  visit(tree, (node) => {
    if (node.type === 'definition' || node.type === 'footnoteDefinition') {
      const map = context.defined[node.type]
      const id = (node.identifier || '').toUpperCase()
      if (id && !own.call(map, id)) {
        map[id] = node
      }
    }
  })

  return handle(tree, context)
}

/**
 * @param {MdastBlockquote} node
 * @param {Context} context
 * @returns {GastQuote}
 */
function blockquote(node, context) {
  return inherit(node, {type: 'quote', value: flow(node, context)})
}

/**
 * @param {MdastCode} node
 * @returns {GastPre}
 */
function code(node) {
  let info = node.lang || null
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
 * @returns {Array<GastHeading|GastText|GastLink>|undefined}
 */
function heading(node, context) {
  const rank = Math.max(node.depth || 1, 1)
  const value = phrasing(node, context)
  const result =
    rank === 1 || rank === 2 || rank === 3
      ? inherit(node, {type: 'heading', rank, value})
      : value
      ? inherit(node, {type: 'text', value})
      : undefined

  if (result) {
    return [...flush(context), result]
  }
}

/**
 * @param {MdastFootnote} node
 * @param {Context} context
 * @returns {string}
 */
function footnote(node, context) {
  /** @type {MdastFootnoteDefinition} */
  const def = {
    type: 'footnoteDefinition',
    identifier: '',
    children: [{type: 'paragraph', children: node.children}]
  }
  return '[' + toLetter(call(inherit(node, def), context).no) + ']'
}

/**
 * @param {MdastFootnoteReference} node
 * @param {Context} context
 * @returns {string|undefined}
 */
function footnoteReference(node, context) {
  const id = (node.identifier || '').toUpperCase()
  const definition =
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
  const id = (node.identifier || '').toUpperCase()
  const definition =
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
 * @returns {GastList}
 */
function list(node, context) {
  // @ts-expect-error always valid content.
  return inherit(node, {type: 'list', children: parent(node, context)})
}

/**
 * @param {MdastListItem} node
 * @param {Context} context
 * @returns {GastListItem}
 */
function listItem(node, context) {
  let value = flow(node, context)

  if (typeof node.checked === 'boolean') {
    value = (node.checked ? '✓' : '✗') + (value ? ' ' + value : '')
  }

  return inherit(node, {type: 'listItem', value})
}

/**
 * @param {MdastParagraph} node
 * @param {Context} context
 * @returns {GastText|undefined}
 */
function paragraph(node, context) {
  const value = phrasing(node, context)
  return value ? inherit(node, {type: 'text', value}) : undefined
}

/**
 * @param {MdastRoot} node
 * @param {Context} context
 * @returns {GastRoot}
 */
function root(node, context) {
  return inherit(node, {
    type: 'root',
    children: wrap(
      context,
      // @ts-expect-error assume valid content.
      [...parent(node, context), ...flush(context, true)]
    )
  })
}

/**
 * @param {MdastTable} node
 * @param {Context} context
 * @returns {GastPre}
 */
function table(node, context) {
  return inherit(node, {
    type: 'pre',
    alt: context.dsvName,
    value: parent(node, context).join('\n') || ''
  })
}

/**
 * @param {MdastTableCell} node
 * @param {Context} context
 * @returns {string}
 */
function tableCell(node, context) {
  const value = phrasing(node, context)

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
  return parent(node, context).join(context.dsvDelimiter)
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
  const nodes = parent(node, context)
  /** @type {Array<string>} */
  const results = []
  let index = -1

  while (++index < nodes.length) {
    // @ts-expect-error always valid content.
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
  return parent(node, context).join('').replace(/\r?\n/g, ' ')
}

/**
 * @param {Extract<MdastNode, UnistParent>} node
 * @param {Context} context
 * @returns {Array<GastContent|string>}
 */
function parent(node, context) {
  const children = node.children || []
  /** @type {Array<GastContent|string>} */
  const results = []
  let index = -1

  while (++index < children.length) {
    const child = children[index]
    const value = handle(child, context)

    if (value) {
      if (Array.isArray(value)) {
        results.push(...value)
      } else {
        // @ts-expect-error: assume no root.
        results.push(value)
      }
    }
  }

  return results
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
 * @param {Context} context
 * @param {boolean} [atEnd=false]
 * @returns {Array<GastLink | GastText>}
 */
function flush(context, atEnd) {
  const links = context.queues.link
  const footnotes = context.queues.footnote
  /** @type {Array<GastLink | GastText>} */
  const result = []
  let index = -1

  if (!context.endlinks || atEnd) {
    while (++index < links.length) {
      let value = '[' + links[index].no + ']'

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
      let value = flow(footnotes[index], context)
      value =
        '[' + toLetter(footnotes[index].no) + ']' + (value ? ' ' + value : '')
      result.push(inherit(footnotes[index], {type: 'text', value}))
    }
  }

  return result
}

/**
 * @param {Extract<MdastNode, MdastResource>} node
 * @param {Context} context
 * @returns {LinkLike}
 */
function resource(node, context) {
  const queued = context.queues.link
  const url = node.url || '#'
  const title = node.title || ''
  let index = -1

  while (++index < queued.length) {
    if (queued[index].url === url && queued[index].title === title) {
      return queued[index]
    }
  }

  const result = inherit(node, {
    type: 'link-like',
    url,
    title,
    no: ++context.link
  })
  queued.push(result)
  return result
}

/**
 * @param {MdastFootnoteDefinition} node
 * @param {Context} context
 * @returns {FootnoteDefinitionWithNumber}
 */
function call(node, context) {
  const queued = context.queues.footnote
  const identifier = node.identifier || ''
  let index = -1

  if (identifier) {
    while (++index < queued.length) {
      if (queued[index].identifier === identifier) {
        return queued[index]
      }
    }
  }

  /** @type {FootnoteDefinitionWithNumber} */
  const fnWithNumber = {
    type: 'footnoteDefinition',
    identifier: node.identifier || '',
    children: node.children || [],
    no: ++context.footnote
  }

  const result = inherit(node, fnWithNumber)
  queued.push(result)
  return result
}

/**
 * @template {GastNode|LinkLike|MdastFootnoteDefinition} N
 * @param {MdastNode|MdastResource} left
 * @param {N} right
 * @returns {N}
 */
function inherit(left, right) {
  if ('data' in left && left.data) right.data = left.data
  return position(left, right)
}

/**
 * @template {GastNode|LinkLike|MdastFootnoteDefinition} N
 * @param {MdastNode|MdastResource|LinkLike} left
 * @param {N} right
 * @returns {N}
 */
function position(left, right) {
  if ('position' in left && left.position) right.position = left.position
  return right
}

/**
 * 1 -> `a`, 26 -> `z`, 27 -> `aa`, …
 *
 * @param {number} value
 * @returns {string}
 */
function toLetter(value) {
  let result = ''

  while (value) {
    const digit = (value - 1) % 26
    result = String.fromCharCode(97 /* `a` */ + digit) + result
    value = Math.floor((value - digit) / 26)
  }

  return result
}

/**
 * @param {Context} context
 * @param {Array<GastRootContent>} nodes
 * @returns {Array<GastRootContent>}
 */
function wrap(context, nodes) {
  let index = -1

  if (context.tight || nodes.length === 0) {
    return nodes
  }

  const result = [nodes[++index]]
  while (++index < nodes.length) {
    result.push({type: 'break'}, nodes[index])
  }

  return result
}
