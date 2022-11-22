/**
 * Encodings supported by the buffer class
 * This is a copy of the typing from Node, copied to prevent Node globals from being needed.
 * Copied from <https://github.com/DefinitelyTyped/DefinitelyTyped/blob/a2bc1d8/types/node/globals.d.ts#L174>
 *
 * @typedef {'ascii'|'utf8'|'utf-8'|'utf16le'|'ucs2'|'ucs-2'|'base64'|'latin1'|'binary'|'hex'} BufferEncoding
 */

/**
 * Acceptable input.
 *
 * @typedef {string|Buffer} Buf
 */

/**
 * @typedef {'whitespace'|'eof'|'eol'|'preSequence'|'preAlt'|'preText'|'headingSequence'|'headingText'|'listSequence'|'listText'|'linkSequence'|'linkUrl'|'linkText'|'quoteSequence'|'quoteText'|'text'} Type
 */

/**
 * Single point.
 *
 * @typedef Point
 * @property {number} line
 * @property {number} column
 * @property {number} offset
 */

/**
 * Base token.
 *
 * @typedef Token
 * @property {Type} type
 * @property {string} value
 * @property {boolean} [hard]
 * @property {Point} start
 * @property {Point} end
 */

/**
 * @returns {(value: Buf|undefined, encoding?: BufferEncoding|undefined, end?: boolean|undefined) => Array<Token>}
 */
export function parser() {
  /** @type {Array<string>} Chunks. */
  const values = []
  let line = 1
  let column = 1
  let offset = 0
  /** @type {boolean} Whether we’re currently in preformatted. */
  let preformatted

  return parse

  /**
   * Parse a chunk.
   *
   * @param {Buf|undefined} buf
   * @param {BufferEncoding|undefined} [encoding]
   * @param {boolean|undefined} [done=false]
   * @returns {Array<Token>}
   */
  function parse(buf, encoding, done) {
    let end = buf ? buf.indexOf('\n') : -1
    let start = 0
    /** @type {Array<Token>} */
    const results = []

    while (end > -1) {
      // @ts-expect-error: `buf` is defined if we’re here.
      let value = values.join('') + buf.slice(start, end).toString(encoding)
      /** @type {string} */
      let eol

      values.length = 0

      if (value.charCodeAt(value.length - 1) === 13 /* `\r` */) {
        value = value.slice(0, -1)
        eol = '\r\n'
      } else {
        eol = '\n'
      }

      parseLine(value)
      add('eol', eol, {hard: !preformatted && value.length === 0})

      start = end + 1
      // @ts-expect-error: `buf` is defined if we’re here.
      end = buf.indexOf('\n', start)
    }

    if (buf) values.push(buf.slice(start).toString(encoding))

    if (done) {
      parseLine(values.join(''))
      add('eof', '')
    }

    return results

    /**
     * Parse a single line.
     *
     * @param {string} value
     */
    // eslint-disable-next-line complexity
    function parseLine(value) {
      const code = value.charCodeAt(0)

      if (
        code === 96 /* `` ` `` */ &&
        value.charCodeAt(1) === 96 /* `` ` `` */ &&
        value.charCodeAt(2) === 96 /* `` ` `` */
      ) {
        add('preSequence', value.slice(0, 3))
        if (value.length !== 3) add('preAlt', value.slice(3))
        preformatted = !preformatted
      }
      // Pre text.
      else if (preformatted) {
        if (value) add('preText', value)
      }
      // Heading.
      else if (code === 35 /* `#` */) {
        let index = 1
        while (index < 3 && value.charCodeAt(index) === 35 /* `#` */) index++
        add('headingSequence', value.slice(0, index))

        // Optional whitespace.
        const start = index
        while (ws(value.charCodeAt(index))) index++
        if (start !== index) add('whitespace', value.slice(start, index))

        // Optional heading text.
        if (index !== value.length) add('headingText', value.slice(index))
      }
      // List.
      else if (
        code === 42 /* `*` */ &&
        (value.length === 1 || ws(value.charCodeAt(1)))
      ) {
        add('listSequence', '*')

        // Optional whitespace.
        let index = 1
        while (ws(value.charCodeAt(index))) index++
        if (index > 1) add('whitespace', value.slice(1, index))

        // Optional list text.
        if (value.length > index) add('listText', value.slice(index))
      }
      // Link
      else if (code === 61 /* `=` */ && value.charCodeAt(1) === 62 /* `>` */) {
        add('linkSequence', value.slice(0, 2))

        // Optional whitespace.
        let index = 2
        while (ws(value.charCodeAt(index))) index++
        if (index > 2) add('whitespace', value.slice(2, index))

        // Optional non-whitespace is the URL.
        let start = index
        while (index < value.length && !ws(value.charCodeAt(index))) index++
        if (index > start) add('linkUrl', value.slice(start, index))

        // Optional whitespace.
        start = index
        while (ws(value.charCodeAt(index))) index++
        if (index > start) add('whitespace', value.slice(start, index))

        // Rest is optional link text.
        if (value.length > index) add('linkText', value.slice(index))
      }
      // Block quote.
      else if (code === 62 /* `>` */) {
        add('quoteSequence', value.slice(0, 1))

        // Optional whitespace.
        let index = 1
        while (ws(value.charCodeAt(index))) index++
        if (index > 1) add('whitespace', value.slice(1, index))

        if (value.length > index) add('quoteText', value.slice(index))
      }
      // Text.
      else if (value.length > 0) {
        add('text', value)
      }
    }

    /**
     * Add a token.
     *
     * @param {Type} type
     * @param {string} value
     * @param {Record<string, unknown>} [fields]
     */
    function add(type, value, fields) {
      const start = now()
      const token = {}

      offset += value.length
      column += value.length

      // Note that only a final line feed is supported: it’s assumed that
      // they’ve been split over separate tokens already.
      if (value.charCodeAt(value.length - 1) === 10 /* `\n` */) {
        line++
        column = 1
      }

      token.type = type
      token.value = value
      if (fields) Object.assign(token, fields)
      token.start = start
      token.end = now()
      results.push(token)
    }

    /**
     * Get the current point.
     *
     * @returns {Point}
     */
    function now() {
      return {line, column, offset}
    }
  }
}

/**
 * Check whether a character code is whitespace
 *
 * @param {number} code
 * @returns {boolean}
 */
function ws(code) {
  return code === 9 /* `\t` */ || code === 32 /* ` ` */
}
