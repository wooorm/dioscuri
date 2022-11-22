import test from 'tape'
import {toMdast} from '../index.js'

test('toMdast', (t) => {
  t.throws(
    () => {
      // @ts-expect-error: unknown.
      toMdast({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on unknown nodes'
  )

  t.throws(
    () => {
      // @ts-expect-error: not a node.
      toMdast({})
    },
    /Cannot handle value `\[object Object]`, expected node/,
    'should throw on non-nodes'
  )

  t.deepEqual(toMdast({type: 'break'}), undefined, 'should ignore a break')

  t.deepEqual(
    // @ts-expect-error: `value` missing.
    toMdast({type: 'text'}),
    undefined,
    'should ignore text w/o content'
  )

  t.deepEqual(
    toMdast({type: 'text', value: 'alpha'}),
    {type: 'paragraph', children: [{type: 'text', value: 'alpha'}]},
    'should support a text w/ content'
  )

  t.deepEqual(
    toMdast({
      type: 'text',
      value: 'a',
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 2, offset: 1}
      }
    }),
    {
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
    },
    'should patch positional info'
  )

  t.deepEqual(
    toMdast({
      type: 'text',
      value: 'a',
      data: {x: 'y', z: 1}
    }),
    {
      type: 'paragraph',
      children: [{type: 'text', value: 'a'}],
      data: {x: 'y', z: 1}
    },
    'should patch data'
  )

  t.deepEqual(
    // @ts-expect-error: `value`, `rank` missing
    toMdast({type: 'heading'}),
    {type: 'heading', depth: 1, children: []},
    'should support a heading w/o rank'
  )

  t.deepEqual(
    // @ts-expect-error: `value` missing
    toMdast({type: 'heading', rank: 4}),
    {type: 'heading', depth: 3, children: []},
    'should cap headings to rank 3'
  )

  t.deepEqual(
    // @ts-expect-error: `rank` missing
    toMdast({type: 'heading', value: 'a'}),
    {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
    'should support a heading w/ value'
  )

  t.deepEqual(
    // @ts-expect-error: `url`, `value` missing
    toMdast({type: 'link'}),
    {
      type: 'paragraph',
      children: [{type: 'link', url: '', title: null, children: []}]
    },
    'should support a link w/o url'
  )

  t.deepEqual(
    // @ts-expect-error: `url` missing
    toMdast({type: 'link', value: 'a'}),
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: '',
          title: null,
          children: [{type: 'text', value: 'a'}]
        }
      ]
    },
    'should support a link w/ `value` w/o url'
  )

  t.deepEqual(
    // @ts-expect-error: `value` missing
    toMdast({type: 'link', url: 'a'}),
    {
      type: 'paragraph',
      children: [{type: 'link', url: 'a', title: null, children: []}]
    },
    'should support a link w/ url'
  )

  t.deepEqual(
    toMdast({type: 'link', url: 'a', value: 'b'}),
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'a',
          title: null,
          children: [{type: 'text', value: 'b'}]
        }
      ]
    },
    'should support a link w/ url, value'
  )

  t.deepEqual(
    // @ts-expect-error: `children` missing
    toMdast({type: 'list'}),
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [{type: 'listItem', spread: false, children: []}]
    },
    'should support a list w/o children'
  )

  t.deepEqual(
    toMdast({type: 'list', children: []}),
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [{type: 'listItem', spread: false, children: []}]
    },
    'should support a list w/ no children'
  )

  t.deepEqual(
    // @ts-expect-error: `value` missing.
    toMdast({type: 'list', children: [{type: 'listItem'}]}),
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [{type: 'listItem', spread: false, children: []}]
    },
    'should support a list w/ a child'
  )

  /** @type {import('../lib/gtast.js').ListItem} */
  const itemA = {type: 'listItem', value: 'a'}

  t.deepEqual(
    toMdast({type: 'list', children: [itemA]}),
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [
        {
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        }
      ]
    },
    'should support a list w/ a child w/ a value'
  )

  /** @type {Array<import('../lib/gtast.js').ListItem>} */
  const items = [
    {type: 'listItem', value: 'a'},
    {type: 'listItem', value: ''},
    {type: 'listItem', value: 'b'}
  ]

  t.deepEqual(
    toMdast({
      type: 'list',
      children: items
    }),
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [
        {
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {type: 'listItem', spread: false, children: []},
        {
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        }
      ]
    },
    'should support a list w/ children'
  )

  t.deepEqual(
    // @ts-expect-error: `value` missing.
    toMdast({type: 'pre'}),
    {type: 'code', lang: null, meta: null, value: ''},
    'should support a pre w/o alt, value'
  )

  t.deepEqual(
    // @ts-expect-error: `value` missing.
    toMdast({type: 'pre', alt: 'a'}),
    {type: 'code', lang: 'a', meta: null, value: ''},
    'should support a pre w/ alt, w/o value'
  )

  t.deepEqual(
    // @ts-expect-error: `value` missing.
    toMdast({type: 'pre', alt: 'a b\tc'}),
    {type: 'code', lang: 'a', meta: 'b\tc', value: ''},
    'should support a pre w/ alt including whitespace, w/o value'
  )

  t.deepEqual(
    toMdast({type: 'pre', value: 'a'}),
    {type: 'code', lang: null, meta: null, value: 'a'},
    'should support a pre w/o alt, w/ value'
  )

  t.deepEqual(
    toMdast({type: 'pre', alt: 'a', value: 'b\nc'}),
    {type: 'code', lang: 'a', meta: null, value: 'b\nc'},
    'should support a pre w/ alt, value'
  )

  t.deepEqual(
    // @ts-expect-error: `value` missing.
    toMdast({type: 'quote'}),
    {type: 'blockquote', children: []},
    'should support a quote w/o value'
  )

  t.deepEqual(
    toMdast({type: 'quote', value: 'a'}),
    {
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    },
    'should support a quote w/ value'
  )

  t.deepEqual(
    // @ts-expect-error: `children` missing.
    toMdast({type: 'root'}),
    {type: 'root', children: []},
    'should support an empty root (1)'
  )

  t.deepEqual(
    toMdast({type: 'root', children: []}),
    {type: 'root', children: []},
    'should support an empty root (2)'
  )

  /** @type {import('../lib/gtast.js').Text} */
  const text = {type: 'text', value: 'a'}

  t.deepEqual(
    toMdast({type: 'root', children: [text]}),
    {
      type: 'root',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    },
    'should support a root w/ content'
  )

  /** @type {import('../lib/gtast.js').ListItem} */
  const itemE = {type: 'listItem', value: 'e'}

  t.deepEqual(
    toMdast({
      type: 'root',
      children: [
        {type: 'text', value: 'a'},
        {type: 'text', value: 'b'},
        {type: 'break'},
        {type: 'pre', value: 'c\n\nd'},
        {type: 'break'},
        {type: 'list', children: [itemE]},
        // These two will be ignored:
        // @ts-expect-error: `value` missing.
        {type: 'text'},
        // @ts-expect-error: `value` missing.
        {type: 'text'},
        // @ts-expect-error: `rank` missing.
        {type: 'heading', value: 'f'},
        {type: 'text', value: 'g'}
      ]
    }),
    {
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'paragraph', children: [{type: 'text', value: 'b'}]},
        {type: 'code', lang: null, meta: null, value: 'c\n\nd'},
        {
          type: 'list',
          ordered: false,
          spread: false,
          children: [
            {
              type: 'listItem',
              spread: false,
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'e'}]}
              ]
            }
          ]
        },
        {type: 'heading', depth: 1, children: [{type: 'text', value: 'f'}]},
        {type: 'paragraph', children: [{type: 'text', value: 'g'}]}
      ]
    },
    'should support a root w/ lots of content'
  )

  t.end()
})
