/**
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('unist').Literal} UnistLiteral
 *
 * @typedef LiteralFields
 * @property {string} value
 * @typedef {UnistLiteral & LiteralFields} Literal
 *
 * @typedef BreakFields
 * @property {'break'} type
 * @typedef {UnistNode & BreakFields} Break
 *
 * @typedef HeadingFields
 * @property {'heading'} type
 * @property {1 | 2 | 3} rank
 * @typedef {Literal & HeadingFields} Heading
 *
 * @typedef LinkFields
 * @property {'link'} type
 * @property {string?} url
 * @typedef {Literal & LinkFields} Link
 *
 * @typedef ListItemFields
 * @property {'listItem'} type
 * @typedef {Literal & ListItemFields} ListItem
 *
 * @typedef ListFields
 * @property {'list'} type
 * @property {ListItem[]} children
 * @typedef {UnistParent & ListFields} List
 *
 * @typedef PreFields
 * @property {'pre'} type
 * @property {string?} alt
 * @typedef {Literal & PreFields} Pre
 *
 * @typedef QuoteFields
 * @property {'quote'} type
 * @typedef {Literal & QuoteFields} Quote
 *
 * @typedef TextFields
 * @property {'text'} type
 * @typedef {Literal & TextFields} Text
 *
 * @typedef RootFields
 * @property {'root'} type
 * @property {Array.<Break | Heading | Link | List | Pre | Quote | Text>} children
 * @typedef {UnistParent & RootFields} Root
 *
 * @typedef {Break | Heading | Link | List | ListItem | Pre | Quote | Text | Root} Node
 */

export {}
