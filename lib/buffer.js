/**
 * @import {Options} from './compiler.js'
 * @import {BufferEncoding, Value} from './parser.js'
 */

import {compiler} from './compiler.js'
import {parser} from './parser.js'

/**
 * Compile gemtext to HTML.
 *
 * @param {Value} doc
 *   Gemtext to parse.
 * @param {BufferEncoding | null | undefined} [encoding]
 *   Character encoding to understand `doc` as when it’s a `Buffer` (optional).
 * @param {Options | null | undefined} [options]
 *   Compile configuration (optional).
 */
export function buffer(doc, encoding, options) {
  return compiler(options)(parser()(doc, encoding, true))
}
