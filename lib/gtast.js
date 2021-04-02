/**
 * @typedef {Object} Break
 * @property {'break'} type
 *
 * @typedef {Object} Heading
 * @property {'heading'} type
 * @property {1|2|3} rank
 * @property {string} value
 *
 * @typedef {Object} Link
 * @property {'link'} type
 * @property {string?} url
 * @property {string} value
 *
 * @typedef {Object} ListItem
 * @property {'listItem'} type
 * @property {string} value
 *
 * @typedef {Object} List
 * @property {'list'} type
 * @property {ListItem[]} children
 *
 * @typedef {Object} Pre
 * @property {'pre'} type
 * @property {string?} alt
 * @property {string} value
 *
 * @typedef {Object} Quote
 * @property {'quote'} type
 * @property {string} value
 *
 * @typedef {Object} Text
 * @property {'text'} type
 * @property {string} value
 *
 * @typedef {Object} Root
 * @property {'root'} type
 * @property {Array.<Break|Heading|Link|List|Pre|Quote|Text>} children
 *
 * @typedef {Break|Heading|Link|List|ListItem|Pre|Quote|Text|Root} Node
 */

export {}
