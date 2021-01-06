import {parser} from './parser.mjs'

export function fromGemtext(doc, encoding) {
  return compile(parser()(doc, encoding, true))
}

function compile(tokens) {
  var stack = [
    {
      type: 'root',
      children: [],
      position: {
        start: point(tokens[0].start),
        end: point(tokens[tokens.length - 1].end)
      }
    }
  ]
  var index = -1
  var token
  var node
  var values

  while (++index < tokens.length) {
    token = tokens[index]

    if (token.type === 'eol' && token.hard) {
      enter({type: 'break'}, token)
      exit(token)
    } else if (token.type === 'headingSequence') {
      node = enter(
        {type: 'heading', rank: token.value.length, value: ''},
        token
      )

      if (tokens[index + 1].type === 'whitespace') index++
      if (tokens[index + 1].type === 'headingText') {
        index++
        node.value = tokens[index].value
      }

      exit(tokens[index])
    } else if (token.type === 'linkSequence') {
      node = enter({type: 'link', url: null, value: ''}, token)

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

      node = enter({type: 'listItem', value: ''}, token)

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
      node = enter({type: 'pre', alt: null, value: ''}, token)
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
      node = enter({type: 'quote', value: ''}, token)

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

  return stack[0]

  function enter(node, token) {
    stack[stack.length - 1].children.push(node)
    stack.push(node)
    node.position = {start: point(token.start)}
    return node
  }

  function exit(token) {
    var node = stack.pop()
    node.position.end = point(token.end)
    return node
  }

  function point(d) {
    return {line: d.line, column: d.column, offset: d.offset}
  }
}
