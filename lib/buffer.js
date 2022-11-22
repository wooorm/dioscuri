/**
 * @typedef {import('./parser.js').Buf} Buf
 * @typedef {import('./parser.js').BufferEncoding} BufferEncoding
 * @typedef {import('./compiler.js').Options} Options
 */

import {compiler} from './compiler.js'
import {parser} from './parser.js'

/**
 * @param {Buf} buf
 *   String or buffer to parse.
 * @param {BufferEncoding} [encoding]
 *   Character encoding to understand `doc` as when it’s a `Buffer`.
 * @param {Options} [options]
 *   Compile configuration (optional).
 */
export function buffer(buf, encoding, options) {
  return compiler(options)(parser()(buf, encoding, true))
}
