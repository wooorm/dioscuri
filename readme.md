# dioscuri

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

Do you:

*   🤨 think the HTTP and HTML are bloated?
*   😔 feel markdown has superfluous features?
*   🤔 find gopher too light?
*   🥰 like BRUTALISM?

Then [Gemini][] might be for you (see [this post][devault] or [this
one][christine] on why it’s cool).

**Dioscuri** (named for the gemini twins Castor and Pollux) is a
tokenizer/lexer/parser/etc for gemtext (the `text/gemini` markup format).
It gives you several things:

*   buffering and streaming interfaces that compile to HTML
*   interfaces to create **[unist][]** compliant abstract syntax trees and
    serialize those back to gemtext
*   interfaces to transform to and from **[mdast][]** (markdown ast)
*   parts that could be used to generate CSTs

These tools can be used if you now have markdown but want to transform it to
gemtext.
Or if you want to combine your posts into an RSS feed or on your “homepage”.
And many other things!

Note that this package is ESM only: Node 12+ is required to use it and it must
be `import`ed instead of `require`d.

## Install

[npm][]:

```sh
npm install dioscuri
```

## Contents

*   [Use](#use)
*   [API](#api)
    *   [`buffer(doc, encoding?, options?)`](#bufferdoc-encoding-options)
    *   [`stream(options?)`](#streamoptions)
    *   [`fromGemtext(doc, encoding?)`](#fromgemtextdoc-encoding)
    *   [`toGemtext(tree)`](#togemtexttree)
    *   [`fromMdast(tree, options?)`](#frommdasttree-options)
    *   [`toMdast(tree)`](#tomdasttree)
*   [gast](#gast)
    *   [`Root`](#root)
    *   [`Break`](#break)
    *   [`Heading`](#heading)
    *   [`Link`](#link)
    *   [`List`](#list)
    *   [`ListItem`](#listitem)
    *   [`Pre`](#pre)
    *   [`Quote`](#quote)
    *   [`Text`](#text)
*   [Security](#security)
*   [Related](#related)
*   [License](#license)

## Use

See each interface below for examples.

## API

### `buffer(doc, encoding?, options?)`

Compile gemtext to HTML.

###### `doc`

Gemtext to parse (`string` or [`Buffer`][buffer]).

###### `encoding`

[Character encoding][encoding] to understand `doc` as when it’s a
[`Buffer`][buffer] (`string`, default: `'utf8'`).

###### `options.defaultLineEnding`

Value to use for line endings not in `doc` (`string`, default: first line
ending or `'\n'`).

Generally, discuri copies line endings (`'\n'` or `'\r\n'`) in the document over
to the compiled HTML.
In some cases, such as `> a`, extra line endings are added:
`<blockquote>\n<p>a</p>\n</blockquote>`.

###### `options.allowDangerousProtocol`

Whether to allow potentially dangerous protocols in URLs (`boolean`, default:
`false`).
URLs relative to the current protocol are always allowed (such as, `image.jpg`).
Otherwise, the allowed protocols are `gemini`, `http`, `https`, `irc`, `ircs`,
`mailto`, and `xmpp`.

###### Returns

`string` — Compiled HTML.

###### Example

Say we have a gemtext document, `example.gmi`:

```gemini
# Hello, world!

Some text

=> https://example.com An example

> A quote

* List
```

An our script, `example.js`, looks as follows:

```js
import fs from 'fs'
import {buffer} from 'dioscuri'

var doc = fs.readFileSync('example.gmi')

console.log(buffer(doc))
```

Now, running `node example.js` yields:

```html
<h1>Hello, world!</h1>
<br />
<p>Some text</p>
<br />
<div><a href="https://example.com">An example</a></div>
<br />
<blockquote>
<p>A quote</p>
</blockquote>
<br />
<ul>
<li>List</li>
</ul>
```

### `stream(options?)`

Streaming interface to compile gemtext to HTML.
`options` is the same as the buffering interface above.

###### Example

Assuming the same `example.gmi` as before and an `example.js` like this:

```js
import fs from 'fs'
import {stream} from 'dioscuri'

fs.createReadStream('example.gmi')
  .on('error', handleError)
  .pipe(stream())
  .pipe(process.stdout)

function handleError(error) {
  throw error // Handle your error here!
}
```

Then running `node example.js` yields the same as before.

### `fromGemtext(doc, encoding?)`

Parse gemtext to into an AST (**[gast][]**).
`doc` and `encoding` are the same as the buffering interface above.

###### Returns

[Root][].

###### Example

Assuming the same `example.gmi` as before and an `example.js` like this:

```js
import fs from 'fs'
import {fromGemtext} from 'dioscuri'

var doc = fs.readFileSync('example.gmi')

console.dir(fromGemtext(doc), {depth: null})
```

Now running `node example.js` yields (positional info removed for brevity):

```js
{
  type: 'root',
  children: [
    {type: 'heading', rank: 1, value: 'Hello, world!'},
    {type: 'break'},
    {type: 'text', value: 'Some text'},
    {type: 'break'},
    {type: 'link', url: 'https://example.com', value: 'An example'},
    {type: 'break'},
    {type: 'quote', value: 'A quote'},
    {type: 'break'},
    {type: 'list', children: [{type: 'listItem', value: 'List'}]}
  ]
}
```

### `toGemtext(tree)`

Serialize **[gast][]**.

###### Example

Say our script `example.js` looks as follows:

```js
import {toGemtext} from 'dioscuri'

var tree = {
  type: 'root',
  children: [
    {type: 'heading', rank: 1, value: 'Hello, world!'},
    {type: 'break'},
    {type: 'text', value: 'Some text'}
  ]
}

console.log(toGemtext(tree))
```

Then running `node example.js` yields:

```gemini
# Hello, world!

Some text
```

### `fromMdast(tree, options?)`

Transform **[mdast][]** to **[gast][]**.

###### `options.endlinks`

Place links at the end of the document (`boolean`, default: `false`).
The default is to place links before the next heading.

###### `options.tight`

Do not put blank lines between blocks (`boolean`, default: `false`).
The default is to place breaks between each block (paragraph, heading, etc).

###### Returns

**[gast][]**, probably.
Some mdast nodes have no gast representation so they are dropped.
If you pass one of those in as `tree`, you’ll get `undefined` out.

###### Example

Say we have a markdown document, `example.md`:

````markdown
# Hello, world!

Some text, *emphasis*, **strong**\
`code()`, and ~~scratch that~~strikethrough.

Here’s a [link](https://example.com 'Just an example'), [link reference][*],
and images: [image reference][*], [](example.png 'Another example').

***

> Some
> quotes

*   a list
*   with another item

1.  “Ordered”
2.  List

```
A
Poem
```

```js
console.log(1)
```

| Name | Value |
| ---- | ----- |
| Beep | 1.2   |
| Boop | 3.14  |

*   [x] Checked
*   [ ] Unchecked

Footnotes[^†], ^[even inline].

[*]: https://example.org "URL definition"

[^†]: Footnote definition
````

An our script, `example.js`, looks as follows:

```js
import fs from 'fs'
import gfm from 'micromark-extension-gfm'
import footnote from 'micromark-extension-footnote'
import fromMarkdown from 'mdast-util-from-markdown'
import mdastGfm from 'mdast-util-gfm'
import mdastFootnote from 'mdast-util-footnote'
import {fromMdast, toGemtext} from 'dioscuri'

var mdast = fromMarkdown(fs.readFileSync('example.md'), {
  extensions: [gfm(), footnote({inlineNotes: true})],
  mdastExtensions: [mdastGfm.fromMarkdown, mdastFootnote.fromMarkdown]
})

console.log(toGemtext(fromMdast(mdast)))
```

Now, running `node example.js` yields:

````gemini
# Hello, world!

Some text, emphasis, strong code(), and strikethrough.

Here’s a link[1], link reference[2], and images: image reference[2], [3].

> Some quotes

* a list
* with another item

* “Ordered”
* List

```
A
Poem
```

```js
console.log(1)
```

```csv
Name,Value
Beep,1.2
Boop,3.14
```

* ✓ Checked
* ✗ Unchecked

Footnotes[a], [b].

=> https://example.com [1] Just an example

=> https://example.org [2] URL definition

=> example.png [3] Another example

[a] Footnote definition

[b] even inline
````

### `toMdast(tree)`

Transform **[gast][]** to **[mdast][]**.

###### Returns

**[mdast][]**, probably.
Some gast nodes have no mdast representation so they are dropped.
If you pass one of those in as `tree`, you’ll get `undefined` out.

###### Example

Say we have a gemtext document, `example.gmi`:

```gemini
# Hello, world!

Some text

=> https://example.com An example

> A quote

* List
```

An our script, `example.js`, looks as follows:

```js
import fs from 'fs'
import {fromGemtext, toMdast} from 'dioscuri'

var doc = fs.readFileSync('example.gmi')

console.dir(toMdast(fromGemtext(doc)), {depth: null})
```

Now, running `node example.js` yields (position info removed for brevity):

```js
{
  type: 'root',
  children: [
    {
      type: 'heading',
      depth: 1,
      children: [{type: 'text', value: 'Hello, world!'}]
    },
    {
      type: 'paragraph',
      children: [{type: 'text', value: 'Some text'}]
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://example.com',
          title: null,
          children: [{type: 'text', value: 'An example'}]
        }
      ]
    },
    {
      type: 'blockquote',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'A quote'}]}
      ]
    },
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [
        {
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'List'}]}
          ]
        }
      ]
    }
  ]
}
```

## gast

**[gast][]** extends **[unist][]**, a format for syntax trees, to benefit from
its ecosystem of utilities.

### `Root`

```idl
interface Root <: Parent {
  type: "root"
  children: [Break | Heading | Link | List | Pre | Quote | Text]
}
```

**Root** ([**Parent**][dfn-parent]) represents a document.

### `Break`

```idl
interface Break <: Node {
  type: "break"
}
```

**Break** ([**Node**][dfn-node]) represents a hard break.

### `Heading`

```idl
interface Heading <: Literal {
  type: "heading"
  rank: 1 <= number <= 3
  value: string?
}
```

**Heading** ([**Literal**][dfn-literal]) represents a heading of a section.

### `Link`

```idl
interface Link <: Literal {
  type: "link"
  url: string
  value: string?
}
```

**Link** ([**Literal**][dfn-literal]) represents a resource.

A `url` field must be present.
It represents a URL to the resource.

### `List`

```idl
interface List <: Parent {
  type: "list"
  children: [ListItem]
}
```

**List** ([**Parent**][dfn-parent]) represents an enumeration.

### `ListItem`

```idl
interface ListItem <: Literal {
  type: "listItem"
  value: string?
}
```

**ListItem** ([**Literal**][dfn-literal]) represents an item in a list.

### `Pre`

```idl
interface Pre <: Literal {
  type: "per"
  alt: string?
  value: string?
}
```

**Pre** ([**Literal**][dfn-literal]) represents preformatted text.

An `alt` field may be present.
When present, the node represents computer code, and the field gives the
language of computer code being marked up.

### `Quote`

```idl
interface Quote <: Literal {
  type: "quote"
  value: string?
}
```

**Quote** ([**Literal**][dfn-literal]) represents a quote.

### `Text`

```idl
interface Text <: Literal {
  type: "text"
  value: string
}
```

**Text** ([**Literal**][dfn-literal]) represents a paragraph.

## Security

Gemtext is safe.
As for the generated HTML: that’s safe by default.
Pass `allowDangerousProtocol: true` if you want to live dangerously.

## Related

*   [`@derhuerst/gemini`](https://github.com/derhuerst/gemini)
    – Gemini protocol server & client
*   [`gemini-fetch`](https://github.com/RangerMauve/gemini-fetch)
    – load Gemini protocol data the way you would fetch from HTTP in JavaScript

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/wooorm/dioscuri/workflows/main/badge.svg

[build]: https://github.com/wooorm/dioscuri/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/dioscuri.svg

[coverage]: https://codecov.io/github/wooorm/dioscuri

[downloads-badge]: https://img.shields.io/npm/dm/dioscuri.svg

[downloads]: https://www.npmjs.com/package/dioscuri

[size-badge]: https://img.shields.io/bundlephobia/minzip/dioscuri.svg

[size]: https://bundlephobia.com/result?p=dioscuri

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[gemini]: https://gemini.circumlunar.space

[unist]: https://github.com/syntax-tree/unist

[mdast]: https://github.com/syntax-tree/mdast

[devault]: https://drewdevault.com/2020/11/01/What-is-Gemini-anyway.html

[christine]: https://christine.website/blog/gemini-web-fear-missing-out-2020-08-02

[encoding]: https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings

[buffer]: https://nodejs.org/api/buffer.html

[gast]: #gast

[root]: #root

[dfn-parent]: https://github.com/syntax-tree/unist#parent

[dfn-node]: https://github.com/syntax-tree/unist#node

[dfn-literal]: https://github.com/syntax-tree/unist#literal
