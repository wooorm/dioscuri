/**
 * @typedef {import('./parser.js').Buf} Buf
 * @typedef {import('./parser.js').BufferEncoding} BufferEncoding
 * @typedef {import('./compiler.js').Options} Options
 */

import {compiler} from './compiler.js'
import {parser} from './parser.js'

/**
 * Compile gemtext to HTML.
 *
 * @param {Buf} doc
 *   Gemtext to parse
 * @param {BufferEncoding} [encoding]
 *   Character encoding to understand `doc` as when it’s a `Buffer`.
 * @param {Options} [options]
 *   Compile configuration (optional).
 */
export function buffer(doc, encoding, options) {
  return compiler(options)(parser()(doc, encoding, true))
}
