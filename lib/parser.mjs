export function parser() {
  var values = []
  var line = 1
  var column = 1
  var offset = 0
  var preformatted

  return parse

  function parse(buffer, encoding, done) {
    var end = buffer ? buffer.indexOf('\n') : -1
    var start = 0
    var results = []
    var value
    var eol

    while (end > -1) {
      value = values.join('') + buffer.slice(start, end).toString(encoding)
      values.length = 0

      if (value.charCodeAt(value.length - 1) === 13 /* `\r` */) {
        value = value.slice(0, -1)
        eol = '\r\n'
      } else {
        eol = '\n'
      }

      parseLine(value)
      add('eol', eol, {hard: !preformatted && !value.length})

      start = end + 1
      end = buffer.indexOf('\n', start)
    }

    if (buffer) values.push(buffer.slice(start).toString(encoding))

    if (done) {
      parseLine(values.join(''))
      add('eof', '')
    }

    return results

    function parseLine(value) {
      var code = value.charCodeAt(0)
      var index
      var start

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
        index = 1
        while (index < 3 && value.charCodeAt(index) === 35 /* `#` */) index++
        add('headingSequence', value.slice(0, index))

        // Optional whitespace.
        start = index
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
        index = 1
        while (ws(value.charCodeAt(index))) index++
        if (index > 1) add('whitespace', value.slice(1, index))

        // Optional list text.
        if (value.length > index) add('listText', value.slice(index))
      }
      // Link
      else if (code === 61 /* `=` */ && value.charCodeAt(1) === 62 /* `>` */) {
        add('linkSequence', value.slice(0, 2))

        // Optional whitespace.
        index = 2
        while (ws(value.charCodeAt(index))) index++
        if (index > 2) add('whitespace', value.slice(2, index))

        // Optional non-whitespace is the URL.
        start = index
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
        index = 1
        while (ws(value.charCodeAt(index))) index++
        if (index > 1) add('whitespace', value.slice(1, index))

        if (value.length > index) add('quoteText', value.slice(index))
      }
      // Text.
      else if (value.length) {
        add('text', value)
      }
    }

    function add(type, value, template) {
      var start = now()
      var token = template || {}

      offset += value.length
      column += value.length

      // Note that only a final line feed is supported: it’s assumed that
      // they’ve been split over separate tokens already.
      if (value.charCodeAt(value.length - 1) === 10 /* `\n` */) {
        line++
        column = 1
      }

      token.type = type
      if (value) token.value = value
      token.start = start
      token.end = now()
      results.push(token)
    }

    function now() {
      return {line: line, column: column, offset: offset}
    }
  }
}

function ws(code) {
  return code === 9 /* `\t` */ || code === 32 /* ` ` */
}
