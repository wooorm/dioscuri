/**
 * @typedef {Object} Break
 * @property {'break'} type
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} Heading
 * @property {'heading'} type
 * @property {1|2|3} rank
 * @property {string} value
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} Link
 * @property {'link'} type
 * @property {string?} url
 * @property {string} value
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} ListItem
 * @property {'listItem'} type
 * @property {string} value
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} List
 * @property {'list'} type
 * @property {ListItem[]} children
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} Pre
 * @property {'pre'} type
 * @property {string?} alt
 * @property {string} value
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} Quote
 * @property {'quote'} type
 * @property {string} value
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} Text
 * @property {'text'} type
 * @property {string} value
 * @property {import('unist').Position} [position]
 *
 * @typedef {Object} Root
 * @property {'root'} type
 * @property {Array.<Break|Heading|Link|List|Pre|Quote|Text>} children
 * @property {import('unist').Position} [position]
 *
 * @typedef {Break|Heading|Link|List|ListItem|Pre|Quote|Text|Root} Node
 */

export {}
