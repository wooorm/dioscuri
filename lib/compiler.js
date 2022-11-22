import {sanitizeUri} from 'micromark-util-sanitize-uri'
import {encode} from 'micromark-util-encode'

/**
 * Configuration.
 *
 * @typedef Options
 * @property {'\r\n'|'\n'} [defaultLineEnding]
 * @property {boolean} [allowDangerousProtocol=false]
 */

/**
 * Create a compile function.
 *
 * @param {Options} [options]
 */
export function compiler(options) {
  const settings = options || {}
  let defaultLineEnding = settings.defaultLineEnding
  const allowDangerousProtocol = settings.allowDangerousProtocol
  /** @type {string|undefined} */
  let atEol
  /** @type {boolean|undefined} */
  let slurpEol
  /** @type {string|boolean} */
  let preformatted
  /** @type {boolean|undefined} */
  let inList

  return compile

  /**
   * Create a compile function.
   *
   * @param {Array<import('./parser.js').Token>} tokens
   * @returns {string}
   */
  // eslint-disable-next-line complexity
  function compile(tokens) {
    let index = -1
    /** @type {Array<string>} */
    const results = []
    /** @type {import('./parser.js').Token} */
    let token

    // Infer an EOL if none was defined.
    if (!defaultLineEnding) {
      while (++index < tokens.length) {
        if (tokens[index].type === 'eol') {
          // @ts-expect-error Correctly parsed.
          defaultLineEnding = tokens[index].value
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
        if (!atEol && defaultLineEnding) results.push(defaultLineEnding)
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
        results.push(
          sanitizeUri(
            token.value,
            allowDangerousProtocol
              ? undefined
              : /^(gemini|https?|ircs?|mailto|xmpp)$/i
          ),
          '">'
        )
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
      } else if (token.type === 'text') {
        results.push('<p>', encode(token.value), '</p>')
      }
      // Else would be `whitespace`.
    }

    return results.join('')
  }
}
