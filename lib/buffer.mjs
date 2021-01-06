'use strict'

import {compiler} from './compiler.mjs'
import {parser} from './parser.mjs'

export function buffer(buf, encoding, options) {
  return compiler(options)(parser()(buf, encoding, true))
}
