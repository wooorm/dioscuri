import {parser} from './parser.js'

/**
 * @typedef {import('unist').Point} Point
 * @typedef {import('./parser.js').Token} Token
 */

/**
 * @typedef {import('./gtast').Break} Break
 * @typedef {import('./gtast').Heading} Heading
 * @typedef {import('./gtast').Link} Link
 * @typedef {import('./gtast').ListItem} ListItem
 * @typedef {import('./gtast').List} List
 * @typedef {import('./gtast').Pre} Pre
 * @typedef {import('./gtast').Quote} Quote
 * @typedef {import('./gtast').Text} Text
 * @typedef {import('./gtast').Root} Root
 * @typedef {import('./gtast').Node} Node
 */

/**
 * @param {import('./parser.js').Buf} buf
 * @param {import('./parser.js').BufferEncoding?} encoding
 * @returns {Node}
 */
export function fromGemtext(buf, encoding) {
  return compile(parser()(buf, encoding, true))
}

/**
 * @param {Token[]} tokens
 * @returns {Node}
 */
function compile(tokens) {
  /** @type {Root} */
  var root = {
    type: 'root',
    children: [],
    position: {
      start: point(tokens[0].start),
      end: point(tokens[tokens.length - 1].end)
    }
  }
  /** @type {Node[]} */
  var stack = [root]
  var index = -1
  /** @type {Token} */
  var token
  /** @type {Node} */
  var node
  /** @type {string[]} */
  var values

  while (++index < tokens.length) {
    token = tokens[index]

    if (token.type === 'eol' && token.hard) {
      enter(/** @type {Break} */ {type: 'break'}, token)
      exit(token)
    } else if (token.type === 'headingSequence') {
      node = enter(
        // @ts-ignore CST is perfect, `token.value.length` == `1|2|3`
        /** @type {Heading} */ {
          type: 'heading',
          rank: token.value.length,
          value: ''
        },
        token
      )

      if (tokens[index + 1].type === 'whitespace') index++
      if (tokens[index + 1].type === 'headingText') {
        index++
        node.value = tokens[index].value
      }

      exit(tokens[index])
    } else if (token.type === 'linkSequence') {
      node = enter(
        /** @type {Link} */ {type: 'link', url: null, value: ''},
        token
      )

      if (tokens[index + 1].type === 'whitespace') index++
      if (tokens[index + 1].type === 'linkUrl') {
        index++
        node.url = tokens[index].value

        if (tokens[index + 1].type === 'whitespace') index++
        if (tokens[index + 1].type === 'linkText') {
          index++
          node.value = tokens[index].value
        }
      }

      exit(tokens[index])
    } else if (token.type === 'listSequence') {
      if (stack[stack.length - 1].type !== 'list') {
        enter(/** @type {List} */ {type: 'list', children: []}, token)
      }

      node = enter(/** @type {ListItem} */ {type: 'listItem', value: ''}, token)

      if (tokens[index + 1].type === 'whitespace') index++
      if (tokens[index + 1].type === 'listText') {
        index++
        node.value = tokens[index].value
      }

      exit(tokens[index])

      if (
        tokens[index + 1].type !== 'eol' ||
        tokens[index + 2].type !== 'listSequence'
      ) {
        exit(tokens[index])
      }
    } else if (token.type === 'preSequence') {
      node = enter(
        /** @type {Pre} */ {type: 'pre', alt: null, value: ''},
        token
      )
      values = []

      if (tokens[index + 1].type === 'preAlt') {
        index++
        node.alt = tokens[index].value
      }

      // Slurp the first EOL.
      if (tokens[index + 1].type === 'eol') index++

      while (++index < tokens.length) {
        if (tokens[index].type === 'eol' || tokens[index].type === 'preText') {
          values.push(tokens[index].value)
        } else {
          // This can only be the closing `preSequence` or and `EOF`.
          // In the case of the former, there was an EOL, which we remove.
          if (tokens[index].type === 'preSequence') {
            values.pop()

            // Move past an (ignored) closing alt.
            if (tokens[index + 1].type === 'preAlt') index++
          }

          break
        }
      }

      node.value = values.join('')

      exit(tokens[index])
    } else if (token.type === 'quoteSequence') {
      node = enter(/** @type {Quote} */ {type: 'quote', value: ''}, token)

      if (tokens[index + 1].type === 'whitespace') index++
      if (tokens[index + 1].type === 'quoteText') {
        index++
        node.value = tokens[index].value
      }

      exit(tokens[index])
    } else if (token.type === 'text') {
      enter(/** @type {Text} */ {type: 'text', value: token.value}, token)
      exit(token)
    }
    // Else would be only soft EOLs and EOF.
  }

  return stack[0]

  /**
   * @template {Node} N
   * @param {N} node
   * @param {Token} token
   * @returns {N}
   */
  function enter(node, token) {
    /** @type {Root|List} */
    // @ts-ignore Yeah, it could be any node, but our algorithm works.
    var parent = stack[stack.length - 1]
    parent.children.push(node)
    stack.push(node)
    node.position = {start: point(token.start), end: point(token.end)}
    return node
  }

  /**
   * @param {Token} token
   * @returns {Node}
   */
  function exit(token) {
    var node = stack.pop()
    node.position.end = point(token.end)
    return node
  }

  /**
   * @param {Point} d
   * @returns {Point}
   */
  function point(d) {
    return {line: d.line, column: d.column, offset: d.offset}
  }
}
