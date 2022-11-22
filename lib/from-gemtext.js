/**
 * @typedef {import('unist').Point} Point
 * @typedef {import('./parser.js').Token} Token
 * @typedef {import('./parser.js').Buf} Buf
 * @typedef {import('./parser.js').BufferEncoding} BufferEncoding
 *
 * @typedef {import('./gast.js').Link} Link
 * @typedef {import('./gast.js').Pre} Pre
 * @typedef {import('./gast.js').Root} Root
 * @typedef {import('./gast.js').Parent} Parent
 * @typedef {import('./gast.js').Node} Node
 */

import {parser} from './parser.js'

/**
 * Parse gemtext to into an AST (gast).
 * `doc` and `encoding` are the same as the buffering interface.
 *
 * @param {Buf} doc
 *   String or buffer to parse.
 * @param {BufferEncoding} [encoding='utf8']
 *   Character encoding to understand `doc` as when it’s a `Buffer`.
 * @returns {Root}
 *   GAST root.
 */
export function fromGemtext(doc, encoding) {
  return compile(parser()(doc, encoding, true))
}

/**
 * Turn tokens into GAST.
 *
 * @param {Array<Token>} tokens
 *   Tokens from `parser`.
 * @returns {Root}
 *   GAST root node.
 */
// eslint-disable-next-line complexity
function compile(tokens) {
  /** @type {Root} */
  const root = {
    type: 'root',
    children: [],
    position: {
      start: point(tokens[0].start),
      end: point(tokens[tokens.length - 1].end)
    }
  }
  /** @type {Array<Extract<Node, Parent>>} */
  const stack = [root]
  let index = -1

  while (++index < tokens.length) {
    const token = tokens[index]

    if (token.type === 'eol' && token.hard) {
      enter({type: 'break'}, token)
      exit(token)
    } else if (token.type === 'headingSequence') {
      const node = enter(
        {
          type: 'heading',
          // @ts-expect-error CST is perfect, `token.value.length` == `1|2|3`
          rank: token.value.length,
          value: ''
        },
        token
      )

      if (tokens[index + 1].type === 'whitespace') index++
      if (tokens[index + 1].type === 'headingText') {
        index++
        // @ts-expect-error token narrow also narrows node type
        node.value = tokens[index].value
      }

      exit(tokens[index])
    } else if (token.type === 'linkSequence') {
      /** @type {Link} */
      const node = enter({type: 'link', url: null, value: ''}, token)

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
        enter({type: 'list', children: []}, token)
      }

      const node = enter({type: 'listItem', value: ''}, token)

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
      /** @type {Pre} */
      const node = enter({type: 'pre', alt: null, value: ''}, token)
      /** @type {Array<string>} */
      const values = []

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
          // eslint-disable-next-line max-depth
          if (tokens[index].type === 'preSequence') {
            values.pop()

            // Move past an (ignored) closing alt.
            // eslint-disable-next-line max-depth
            if (tokens[index + 1].type === 'preAlt') index++
          }

          break
        }
      }

      node.value = values.join('')

      exit(tokens[index])
    } else if (token.type === 'quoteSequence') {
      const node = enter({type: 'quote', value: ''}, token)

      if (tokens[index + 1].type === 'whitespace') index++
      if (tokens[index + 1].type === 'quoteText') {
        index++
        node.value = tokens[index].value
      }

      exit(tokens[index])
    } else if (token.type === 'text') {
      enter({type: 'text', value: token.value}, token)
      exit(token)
    }
    // Else would be only soft EOLs and EOF.
  }

  // @ts-expect-error: it’s a root.
  return stack[0]

  /**
   * @template {Node} N
   * @param {N} node
   * @param {Token} token
   * @returns {N}
   */
  function enter(node, token) {
    const parent = stack[stack.length - 1]
    // @ts-expect-error: assume parent.
    parent.children.push(node)
    // @ts-expect-error: assume popped immediately.
    stack.push(node)
    node.position = {start: point(token.start), end: point(token.end)}
    return node
  }

  /**
   * @param {Token} token
   * @returns {Node}
   */
  function exit(token) {
    const node = stack.pop()
    // @ts-expect-error: hush: we set position in `enter`
    node.position.end = point(token.end)
    // @ts-expect-error: hush: always defined.
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
