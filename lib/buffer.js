import {compiler} from './compiler.js'
import {parser} from './parser.js'

export function buffer(buf, encoding, options) {
  return compiler(options)(parser()(buf, encoding, true))
}
