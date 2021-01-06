var characterReferences = {'"': 'quot', '&': 'amp', '<': 'lt', '>': 'gt'}
var fromCharCode = String.fromCharCode

export function compiler(options) {
  var settings = options || {}
  var defaultLineEnding = settings.defaultLineEnding
  var allowDangerousProtocol = settings.allowDangerousProtocol
  var atEol
  var slurpEol
  var preformatted
  var inList

  return compile

  function compile(tokens) {
    var results = []
    var index = -1
    var token

    // Infer an EOL if none was defined.
    if (!defaultLineEnding) {
      while (++index < tokens.length) {
        if (tokens[index].type === 'eol') {
          defaultLineEnding = encode(tokens[index].value)
          break
        }
      }

      index = -1
    }

    while (++index < tokens.length) {
      token = tokens[index]

      if (
        inList &&
        ((token.type === 'eol' && token.hard) ||
          (token.type !== 'eol' &&
            token.type !== 'listSequence' &&
            token.type !== 'listText' &&
            token.type !== 'whitespace'))
      ) {
        // If an `atEol` is still set, we haven’t seen an EOL yet, so add one.
        if (atEol) results.push(atEol, defaultLineEnding || '\n')
        results.push('</ul>')
        // If an EOL was seen, then we have more content.
        // Also note that in that case `defaultLineEnding` is set.
        if (!atEol) results.push(defaultLineEnding)
        inList = undefined
        atEol = undefined
      }

      if (token.type === 'eol') {
        if (atEol) results.push(atEol)
        if (token.hard) results.push('<br />')
        if (!slurpEol) results.push(encode(token.value))
        atEol = undefined
        slurpEol = undefined
      } else if (token.type === 'eof') {
        if (atEol) results.push(atEol)
        if (preformatted === 'preAlt') results.push('</code>')
        if (preformatted) results.push('</pre>')
      } else if (token.type === 'quoteSequence') {
        results.push('<blockquote>')
        atEol = '</blockquote>'
      } else if (token.type === 'linkSequence') {
        results.push('<div><a href="')
        atEol = '"></a></div>' // Set this for when there’s no `linkUrl`.
      } else if (token.type === 'linkUrl') {
        results.push(url(token.value, allowDangerousProtocol), '">')
        atEol = '</a></div>'
      } else if (token.type === 'listSequence') {
        if (!inList) {
          results.push('<ul>', defaultLineEnding || '\n')
          inList = true
        }

        results.push('<li>')
        atEol = '</li>'
      } else if (token.type === 'headingSequence') {
        results.push('<h', String(token.value.length), '>')
        atEol = '</h' + token.value.length + '>'
      } else if (token.type === 'preSequence') {
        results.push(
          preformatted === 'preAlt' ? '</code>' : '',
          '<',
          preformatted ? '/' : '',
          'pre>'
        )
        preformatted = !preformatted
        if (preformatted) slurpEol = true
      } else if (token.type === 'preAlt') {
        if (preformatted) {
          results.push('<code class="language-', encode(token.value), '">')
          preformatted = 'preAlt'
        }
      } else if (
        token.type === 'headingText' ||
        token.type === 'linkText' ||
        token.type === 'listText' ||
        token.type === 'preText'
      ) {
        results.push(encode(token.value))
      } else if (token.type === 'quoteText') {
        results.push(
          defaultLineEnding || '\n',
          '<p>',
          token.value,
          '</p>',
          defaultLineEnding || '\n'
        )
      } else if (token.type === 'quoteText' || token.type === 'text') {
        results.push('<p>', encode(token.value), '</p>')
      }
      // Else would be `whitespace`.
    }

    return results.join('')
  }
}

// Make a value safe for injection as a URL.
// This does encode unsafe characters with percent-encoding, skipping already
// encoded sequences (`normalizeUri`).
// Further unsafe characters are encoded as character references (`encode`).
// Finally, if the URL includes an unknown protocol (such as a dangerous
// example, `javascript:`), the value is ignored.
//
// To do: externalize this from `micromark` and incorporate that lib here.
function url(url, allowDangerousProtocol) {
  var value = encode(normalizeUri(url))
  var colon = value.indexOf(':')
  var questionMark = value.indexOf('?')
  var numberSign = value.indexOf('#')
  var slash = value.indexOf('/')

  if (
    allowDangerousProtocol ||
    // If there is no protocol, it’s relative.
    colon < 0 ||
    // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
    (slash > -1 && colon > slash) ||
    (questionMark > -1 && colon > questionMark) ||
    (numberSign > -1 && colon > numberSign) ||
    // It is a protocol, it should be allowed.
    /^(gemini|https?|ircs?|mailto|xmpp)$/i.test(value.slice(0, colon))
  ) {
    return value
  }

  return ''
}

// Encode unsafe characters with percent-encoding, skipping already encoded
// sequences.
//
// To do: externalize this from `micromark` and incorporate that lib here.
function normalizeUri(value) {
  var index = -1
  var result = []
  var start = 0
  var skip = 0
  var code
  var next
  var replace

  while (++index < value.length) {
    code = value.charCodeAt(index)

    // A correct percent encoded value.
    if (
      code === 37 /* `%` */ &&
      asciiAlphanumeric(value.charCodeAt(index + 1)) &&
      asciiAlphanumeric(value.charCodeAt(index + 2))
    ) {
      skip = 2
    }
    // ASCII.
    else if (code < 128) {
      if (!/[!#$&-;=?-Z_a-z~]/.test(fromCharCode(code))) {
        replace = fromCharCode(code)
      }
    }
    // Astral.
    else if (code > 55295 && code < 57344) {
      next = value.charCodeAt(index + 1)

      // A correct surrogate pair.
      if (code < 56320 && next > 56319 && next < 57344) {
        replace = fromCharCode(code, next)
        skip = 1
      }
      // Lone surrogate.
      else {
        replace = '�'
      }
    }
    // Unicode.
    else {
      replace = fromCharCode(code)
    }

    if (replace) {
      result.push(value.slice(start, index), encodeURIComponent(replace))
      start = index + skip + 1
      replace = undefined
    }

    if (skip) {
      index += skip
      skip = 0
    }
  }

  return result.join('') + value.slice(start)
}

// Make a value safe for injection in HTML.
function encode(value) {
  return value.replace(/["&<>]/g, replaceReference)
}

function replaceReference(value) {
  return '&' + characterReferences[value] + ';'
}

function asciiAlphanumeric(code) {
  return /[\dA-Za-z]/.test(fromCharCode(code))
}
