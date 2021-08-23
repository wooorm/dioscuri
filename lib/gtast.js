/**
 * @typedef BreakFields
 * @property {'break'} type
 *
 * @typedef HeadingFields
 * @property {'heading'} type
 * @property {1|2|3} rank
 * @property {string} value
 *
 * @typedef LinkFields
 * @property {'link'} type
 * @property {string?} url
 * @property {string} value
 *
 * @typedef ListItemFields
 * @property {'listItem'} type
 * @property {string} value
 *
 * @typedef ListFields
 * @property {'list'} type
 * @property {ListItem[]} children
 *
 * @typedef PreFields
 * @property {'pre'} type
 * @property {string?} [alt]
 * @property {string} value
 *
 * @typedef QuoteFields
 * @property {'quote'} type
 * @property {string} value
 *
 * @typedef TextFields
 * @property {'text'} type
 * @property {string} value
 *
 * @typedef RootFields
 * @property {'root'} type
 * @property {Array.<Break|Heading|Link|List|Pre|Quote|Text>} children
 *
 * @typedef {import('unist').Node & BreakFields} Break
 * @typedef {import('unist').Literal & HeadingFields} Heading
 * @typedef {import('unist').Literal & LinkFields} Link
 * @typedef {import('unist').Literal & ListItemFields} ListItem
 * @typedef {import('unist').Parent & ListFields} List
 * @typedef {import('unist').Literal & PreFields} Pre
 * @typedef {import('unist').Literal & QuoteFields} Quote
 * @typedef {import('unist').Literal & TextFields} Text
 * @typedef {import('unist').Parent & RootFields} Root
 *
 * @typedef {Break|Heading|Link|List|ListItem|Pre|Quote|Text} Content
 * @typedef {Content|Root} Node
 */

export {}
