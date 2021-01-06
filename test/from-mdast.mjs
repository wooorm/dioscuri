'use strict'

import test from 'tape'
import {fromMdast} from '../index.mjs'

test('fromMdast', function (t) {
  t.throws(
    function () {
      fromMdast({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on unknown nodes'
  )

  t.throws(
    function () {
      fromMdast({})
    },
    /Cannot handle value `\[object Object]`, expected node/,
    'should throw on non-nodes'
  )

  t.deepEqual(
    fromMdast({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'a',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 2, offset: 1}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 2, offset: 1}
      }
    }),
    {
      type: 'text',
      value: 'a',
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 2, offset: 1}
      }
    },
    'should patch positional info'
  )

  t.deepEqual(
    fromMdast({
      type: 'paragraph',
      children: [{type: 'text', value: 'a'}],
      data: {x: 'y', z: 1}
    }),
    {
      type: 'text',
      value: 'a',
      data: {x: 'y', z: 1}
    },
    'should patch data'
  )

  t.deepEqual(
    fromMdast({type: 'paragraph', children: [{type: 'text', value: 'a'}]}),
    {type: 'text', value: 'a'},
    'should support a paragraph'
  )

  t.deepEqual(
    fromMdast({type: 'paragraph'}),
    undefined,
    'should ignore a paragraph w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'heading', depth: 1}),
    {type: 'heading', rank: 1, value: ''},
    'should support a heading w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'heading', children: [{type: 'text', value: 'a'}]}),
    {type: 'heading', rank: 1, value: 'a'},
    'should support a heading (no depth)'
  )

  t.deepEqual(
    fromMdast({
      type: 'heading',
      depth: 1,
      children: [{type: 'text', value: 'a'}]
    }),
    {type: 'heading', rank: 1, value: 'a'},
    'should support a heading (depth: 1)'
  )

  t.deepEqual(
    fromMdast({
      type: 'heading',
      depth: 3,
      children: [{type: 'text', value: 'a'}]
    }),
    {type: 'heading', rank: 3, value: 'a'},
    'should support a heading (depth: 3)'
  )

  t.deepEqual(
    fromMdast({
      type: 'heading',
      depth: 4,
      children: [{type: 'text', value: 'a'}]
    }),
    {type: 'text', value: 'a'},
    'should support a heading (depth: 4) as a `text`'
  )

  t.deepEqual(
    fromMdast({type: 'heading', depth: 5}),
    undefined,
    'should ignore a heading gte 3 w/o value'
  )

  t.deepEqual(
    fromMdast({type: 'thematicBreak'}),
    undefined,
    'should ignore a thematic break'
  )

  t.deepEqual(
    fromMdast({type: 'blockquote'}),
    {type: 'quote', value: ''},
    'should support a blockquote w/o content'
  )

  t.deepEqual(
    fromMdast({
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    }),
    {type: 'quote', value: 'a'},
    'should support a blockquote w/ a paragraph'
  )

  t.deepEqual(
    fromMdast({
      type: 'blockquote',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'heading', children: [{type: 'text', value: 'b'}]},
        {type: 'paragraph', children: [{type: 'text', value: 'c'}]}
      ]
    }),
    {type: 'quote', value: 'a b c'},
    'should support a blockquote w/ several children'
  )

  t.deepEqual(
    fromMdast({type: 'list', children: []}),
    {type: 'list', children: []},
    'should support a list w/o children'
  )

  t.deepEqual(
    fromMdast({type: 'list', children: [{type: 'listItem'}]}),
    {type: 'list', children: [{type: 'listItem', value: ''}]},
    'should support a list w/ a child w/o value'
  )

  t.deepEqual(
    fromMdast({
      type: 'list',
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        }
      ]
    }),
    {type: 'list', children: [{type: 'listItem', value: 'a'}]},
    'should support a list w/ a child w/ flow'
  )

  t.deepEqual(
    fromMdast({
      type: 'list',
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            {type: 'heading', children: [{type: 'text', value: 'b'}]},
            {type: 'paragraph', children: [{type: 'text', value: 'c'}]}
          ]
        }
      ]
    }),
    {type: 'list', children: [{type: 'listItem', value: 'a b c'}]},
    'should support a list w/ a child w/ several children'
  )

  t.deepEqual(
    fromMdast({type: 'code'}),
    {type: 'pre', alt: null, value: ''},
    'should support a pre w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'code', lang: 'a'}),
    {type: 'pre', alt: 'a', value: ''},
    'should support a pre w/ lang, w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'code', lang: 'a', meta: 'b c'}),
    {type: 'pre', alt: 'a b c', value: ''},
    'should support a pre w/ lang, meta; w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'code', lang: 'a', meta: 'b c', value: 'd\n\ne'}),
    {type: 'pre', alt: 'a b c', value: 'd\n\ne'},
    'should support a pre w/ lang, meta, content'
  )

  t.deepEqual(
    fromMdast({type: 'emphasis'}),
    '',
    'should support emphasis w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'emphasis', children: [{type: 'text', value: 'a'}]}),
    'a',
    'should support emphasis w/ content'
  )

  t.deepEqual(
    fromMdast({
      type: 'emphasis',
      children: [
        {type: 'text', value: 'a '},
        {type: 'inlineCode', value: 'b'},
        {type: 'text', value: ' c.'}
      ]
    }),
    'a b c.',
    'should support emphasis w/ more content'
  )

  t.deepEqual(
    fromMdast({type: 'strong'}),
    '',
    'should support strong w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'strong', children: [{type: 'text', value: 'a'}]}),
    'a',
    'should support strong w/ content'
  )

  t.deepEqual(
    fromMdast({
      type: 'strong',
      children: [
        {type: 'text', value: 'a '},
        {type: 'strong', children: [{type: 'text', value: 'b'}]},
        {type: 'text', value: ' c.'}
      ]
    }),
    'a b c.',
    'should support strong w/ more content'
  )

  t.deepEqual(
    fromMdast({type: 'inlineCode'}),
    '',
    'should support inlineCode w/o content'
  )

  t.deepEqual(
    fromMdast({type: 'inlineCode', value: 'a'}),
    'a',
    'should support inlineCode w/ content'
  )

  t.deepEqual(
    fromMdast({type: 'break'}),
    ' ',
    'should turn breaks into a space'
  )

  t.deepEqual(
    fromMdast({
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a'},
        {type: 'break'},
        {type: 'text', value: 'b'}
      ]
    }),
    {type: 'text', value: 'a b'},
    'should support breaks in paragraphs'
  )

  t.deepEqual(
    fromMdast({type: 'definition'}),
    undefined,
    'should ignore `definition` nodes'
  )

  t.deepEqual(fromMdast({type: 'link'}), '[1]', 'should support a `link`')

  t.deepEqual(
    fromMdast({type: 'linkReference'}),
    '',
    'should ignore an undefined `linkReference`'
  )

  t.deepEqual(
    fromMdast({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{type: 'linkReference', identifier: 'a'}]
        },
        {type: 'definition', identifier: 'a'}
      ]
    }),
    {
      type: 'root',
      children: [
        {type: 'text', value: '[1]'},
        {type: 'break'},
        {type: 'link', url: '#', value: '[1]'}
      ]
    },
    'should support a defined `linkReference`'
  )

  t.deepEqual(fromMdast({type: 'image'}), '[1]', 'should support an `image`')

  t.deepEqual(
    fromMdast({type: 'imageReference'}),
    '',
    'should ignore an undefined `imageReference`'
  )

  t.deepEqual(
    fromMdast({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{type: 'imageReference', identifier: 'a'}]
        },
        {type: 'definition', identifier: 'a'}
      ]
    }),
    {
      type: 'root',
      children: [
        {type: 'text', value: '[1]'},
        {type: 'break'},
        {type: 'link', url: '#', value: '[1]'}
      ]
    },
    'should support a defined `imageReference`'
  )

  t.deepEqual(
    fromMdast({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'link',
              url: 'b',
              children: [{type: 'text', value: 'c'}]
            },
            {type: 'text', value: ' d.'}
          ]
        }
      ]
    }),
    {
      type: 'root',
      children: [
        {type: 'text', value: 'a c[1] d.'},
        {type: 'break'},
        {type: 'link', url: 'b', value: '[1]'}
      ]
    },
    'should support links with URLs'
  )

  t.deepEqual(
    fromMdast({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'link',
              url: 'x',
              children: [{type: 'text', value: 'c'}]
            },
            {type: 'text', value: ' d '},
            {
              type: 'linkReference',
              identifier: 'e',
              children: [{type: 'text', value: 'f'}]
            }
          ]
        },
        {type: 'definition', identifier: 'e', url: 'x'}
      ]
    }),
    {
      type: 'root',
      children: [
        {type: 'text', value: 'a c[1] d f[1]'},
        {type: 'break'},
        {type: 'link', url: 'x', value: '[1]'}
      ]
    },
    'should support link and link references referencing the same URL'
  )

  t.deepEqual(
    fromMdast({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'link',
              url: 'x',
              title: 'a',
              children: [{type: 'text', value: 'c'}]
            },
            {type: 'text', value: ' d '},
            {
              type: 'linkReference',
              identifier: 'e',
              children: [{type: 'text', value: 'f'}]
            }
          ]
        },
        {type: 'definition', identifier: 'e', url: 'x'}
      ]
    }),
    {
      type: 'root',
      children: [
        {type: 'text', value: 'a c[1] d f[2]'},
        {type: 'break'},
        {type: 'link', url: 'x', value: '[1] a'},
        {type: 'break'},
        {type: 'link', url: 'x', value: '[2]'}
      ]
    },
    'should support link and link references referencing the same URL w/ different titles'
  )

  t.deepEqual(
    fromMdast({
      type: 'root',
      children: [
        {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'b '},
            {type: 'link', url: 'x', children: [{type: 'text', value: 'c'}]},
            {type: 'link', url: 'y', children: [{type: 'text', value: 'd'}]},
            {type: 'text', value: ' e.'}
          ]
        },
        {type: 'heading', depth: 1, children: [{type: 'text', value: 'f'}]},
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'g '},
            {type: 'link', url: 'x', children: [{type: 'text', value: 'h'}]},
            {type: 'text', value: ' i.'}
          ]
        }
      ]
    }),
    {
      type: 'root',
      children: [
        {type: 'heading', rank: 1, value: 'a'},
        {type: 'break'},
        {type: 'text', value: 'b c[1]d[2] e.'},
        {type: 'break'},
        {type: 'link', url: 'x', value: '[1]'},
        {type: 'break'},
        {type: 'link', url: 'y', value: '[2]'},
        {type: 'break'},
        {type: 'heading', rank: 1, value: 'f'},
        {type: 'break'},
        {type: 'text', value: 'g h[3] i.'},
        {type: 'break'},
        {type: 'link', url: 'x', value: '[3]'}
      ]
    },
    'should add used links to each section by default'
  )

  t.deepEqual(
    fromMdast(
      {
        type: 'root',
        children: [
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'b '},
              {type: 'link', url: 'x', children: [{type: 'text', value: 'c'}]},
              {type: 'text', value: ' d.'}
            ]
          },
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'e'}]},
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'f '},
              {type: 'link', url: 'x', children: [{type: 'text', value: 'g'}]},
              {type: 'text', value: ' h.'}
            ]
          }
        ]
      },
      {endlinks: true}
    ),
    {
      type: 'root',
      children: [
        {type: 'heading', rank: 1, value: 'a'},
        {type: 'break'},
        {type: 'text', value: 'b c[1] d.'},
        {type: 'break'},
        {type: 'heading', rank: 1, value: 'e'},
        {type: 'break'},
        {type: 'text', value: 'f g[1] h.'},
        {type: 'break'},
        {type: 'link', url: 'x', value: '[1]'}
      ]
    },
    'should support `endlinks` when `endlinks: true`'
  )

  t.deepEqual(
    fromMdast(
      {
        type: 'root',
        children: [
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'b '},
              {type: 'link', url: 'x', children: [{type: 'text', value: 'c'}]},
              {type: 'text', value: ' d.'}
            ]
          },
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'e'}]},
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'f '},
              {type: 'link', url: 'x', children: [{type: 'text', value: 'g'}]},
              {type: 'text', value: ' h.'}
            ]
          }
        ]
      },
      {tight: true}
    ),
    {
      type: 'root',
      children: [
        {type: 'heading', rank: 1, value: 'a'},
        {type: 'text', value: 'b c[1] d.'},
        {type: 'link', url: 'x', value: '[1]'},
        {type: 'heading', rank: 1, value: 'e'},
        {type: 'text', value: 'f g[2] h.'},
        {type: 'link', url: 'x', value: '[2]'}
      ]
    },
    'should not add breaks (blank lines) with `tight: true`'
  )

  t.test('gfm', function (t) {
    t.deepEqual(
      fromMdast({type: 'tableCell'}),
      '',
      'should support a table cell w/o value'
    )

    t.deepEqual(
      fromMdast({
        type: 'tableCell',
        children: [
          {type: 'text', value: 'a '},
          {type: 'strong', children: [{type: 'text', value: 'b'}]},
          {type: 'text', value: ' c'}
        ]
      }),
      'a b c',
      'should support a table cell'
    )

    t.deepEqual(
      fromMdast({
        type: 'tableCell',
        children: [{type: 'text', value: 'a , b'}]
      }),
      '"a , b"',
      'should support a table cell including a comma'
    )

    t.deepEqual(
      fromMdast({
        type: 'tableCell',
        children: [{type: 'text', value: 'a " b'}]
      }),
      '"a "" b"',
      'should support a table cell including a quote'
    )

    t.deepEqual(
      fromMdast({type: 'tableRow'}),
      '',
      'should support a table row w/o value'
    )

    t.deepEqual(
      fromMdast({
        type: 'tableRow',
        children: [
          {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
          {type: 'tableCell', children: [{type: 'text', value: 'b"c'}]},
          {type: 'tableCell', children: [{type: 'text', value: 'd'}]}
        ]
      }),
      'a,"b""c",d',
      'should support a table row w/ values'
    )

    t.deepEqual(
      fromMdast({type: 'table', children: []}),
      {type: 'pre', alt: 'csv', value: ''},
      'should support a table w/ values'
    )

    t.deepEqual(
      fromMdast({
        type: 'table',
        children: [
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'b'}]}
            ]
          },
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: 'c'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'd"e'}]}
            ]
          },
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: 'f'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'g,h'}]}
            ]
          }
        ]
      }),
      {type: 'pre', alt: 'csv', value: 'a,b\nc,"d""e"\nf,"g,h"'},
      'should support a table w/ values'
    )

    t.deepEqual(
      fromMdast({
        type: 'list',
        children: [
          {type: 'listItem', checked: false, children: []},
          {
            type: 'listItem',
            checked: true,
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
            ]
          },
          {
            type: 'listItem',
            checked: null,
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
            ]
          }
        ]
      }),
      {
        type: 'list',
        children: [
          {type: 'listItem', value: '✗'},
          {type: 'listItem', value: '✓ a'},
          {type: 'listItem', value: 'b'}
        ]
      },
      'should support checked, unchecked list items'
    )

    t.deepEqual(
      fromMdast({
        type: 'paragraph',
        children: [
          {type: 'text', value: 'a '},
          {type: 'delete', children: [{type: 'strikethrough', value: 'b'}]},
          {type: 'text', value: 'c'},
          {type: 'text', value: ' d.'}
        ]
      }),
      {type: 'text', value: 'a c d.'},
      'should ignore delete'
    )

    t.end()
  })

  t.test('frontmatter', function (t) {
    t.deepEqual(
      fromMdast({
        type: 'root',
        children: [
          {type: 'yaml', value: 'a: no'},
          {
            type: 'paragraph',
            children: [{type: 'text', value: 'b'}]
          }
        ]
      }),
      {type: 'root', children: [{type: 'text', value: 'b'}]},
      'should ignore yaml'
    )

    t.deepEqual(
      fromMdast({type: 'toml', value: 'a: no'}),
      undefined,
      'should ignore toml'
    )

    t.end()
  })

  t.test('footnotes', function (t) {
    t.deepEqual(
      fromMdast({
        type: 'footnoteDefinition',
        identifier: 'a',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'b'}]}]
      }),
      undefined,
      'should ignore footnote definitions'
    )

    t.deepEqual(
      fromMdast({type: 'footnote', children: [{type: 'text', value: 'b'}]}),
      '[a]',
      'should support footnotes'
    )

    t.deepEqual(
      fromMdast({type: 'footnoteReference'}),
      undefined,
      'should ignore an undefined `footnoteReference`'
    )

    t.deepEqual(
      fromMdast({
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{type: 'footnoteReference', identifier: 'a'}]
          },
          {
            type: 'footnoteDefinition',
            identifier: 'a',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
            ]
          }
        ]
      }),
      {
        type: 'root',
        children: [
          {type: 'text', value: '[a]'},
          {type: 'break'},
          {type: 'text', value: '[a] b'}
        ]
      },
      'should support a defined `footnoteReference`'
    )

    t.deepEqual(
      fromMdast({
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{type: 'footnoteReference', identifier: 'a'}]
          },
          {type: 'footnoteDefinition', identifier: 'a'}
        ]
      }),
      {
        type: 'root',
        children: [
          {type: 'text', value: '[a]'},
          {type: 'break'},
          {type: 'text', value: '[a]'}
        ]
      },
      'should support a defined `footnoteReference` w/o content'
    )

    t.deepEqual(
      fromMdast({
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'a'},
              {type: 'footnoteReference', identifier: 'b'},
              {type: 'text', value: ' c'},
              {type: 'footnoteReference', identifier: 'b'},
              {type: 'text', value: ' d.'}
            ]
          },
          {
            type: 'footnoteDefinition',
            identifier: 'b',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'e'}]}
            ]
          }
        ]
      }),
      {
        type: 'root',
        children: [
          {type: 'text', value: 'a[a] c[a] d.'},
          {type: 'break'},
          {type: 'text', value: '[a] e'}
        ]
      },
      'should support footnote reference referencing the same identifier'
    )

    t.deepEqual(
      fromMdast({
        type: 'root',
        children: [
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'b'},
              {type: 'footnoteReference', identifier: 'x'},
              {type: 'text', value: ' c'},
              {type: 'footnoteReference', identifier: 'y'},
              {type: 'text', value: ' d.'}
            ]
          },
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'e'}]},
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'f'},
              {type: 'footnoteReference', identifier: 'y'},
              {type: 'text', value: ' g.'}
            ]
          },
          {
            type: 'footnoteDefinition',
            identifier: 'x',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: '111'}]}
            ]
          },
          {
            type: 'footnoteDefinition',
            identifier: 'y',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: '222'}]}
            ]
          }
        ]
      }),
      {
        type: 'root',
        children: [
          {type: 'heading', rank: 1, value: 'a'},
          {type: 'break'},
          {type: 'text', value: 'b[a] c[b] d.'},
          {type: 'break'},
          {type: 'heading', rank: 1, value: 'e'},
          {type: 'break'},
          {type: 'text', value: 'f[b] g.'},
          {type: 'break'},
          {type: 'text', value: '[a] 111'},
          {type: 'break'},
          {type: 'text', value: '[b] 222'}
        ]
      },
      'should support footnotes at the end of the document'
    )

    t.end()
  })

  t.end()
})
