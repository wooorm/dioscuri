import {compiler} from './compiler.js'
import {parser} from './parser.js'

/**
 * @param {import('./parser.js').Buf} buf
 * @param {import('./parser.js').BufferEncoding?} [encoding]
 * @param {import('./compiler.js').Options} [options]
 */
export function buffer(buf, encoding, options) {
  return compiler(options)(parser()(buf, encoding, true))
}
