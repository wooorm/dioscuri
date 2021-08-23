import test from 'tape'
import {toMdast} from '../index.js'

test('toMdast', (t) => {
  t.throws(
    () => {
      toMdast({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on unknown nodes'
  )

  t.throws(
    () => {
      toMdast({})
    },
    /Cannot handle value `\[object Object]`, expected node/,
    'should throw on non-nodes'
  )

  t.deepEqual(toMdast({type: 'break'}), undefined, 'should ignore a break')

  t.deepEqual(
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
    toMdast({type: 'heading'}),
    {type: 'heading', depth: 1, children: []},
    'should support a heading w/o rank'
  )

  t.deepEqual(
    toMdast({type: 'heading', rank: 4}),
    {type: 'heading', depth: 3, children: []},
    'should cap headings to rank 3'
  )

  t.deepEqual(
    toMdast({type: 'heading', value: 'a'}),
    {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
    'should support a heading w/ value'
  )

  t.deepEqual(
    toMdast({type: 'link'}),
    {
      type: 'paragraph',
      children: [{type: 'link', url: '', title: null, children: []}]
    },
    'should support a link w/o url'
  )

  t.deepEqual(
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
    toMdast({type: 'list', children: [{type: 'listItem'}]}),
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [{type: 'listItem', spread: false, children: []}]
    },
    'should support a list w/ a child'
  )

  t.deepEqual(
    toMdast({type: 'list', children: [{type: 'listItem', value: 'a'}]}),
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

  t.deepEqual(
    toMdast({
      type: 'list',
      children: [
        {type: 'listItem', value: 'a'},
        {type: 'listItem', value: ''},
        {type: 'listItem', value: 'b'}
      ]
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
    toMdast({type: 'pre'}),
    {type: 'code', lang: null, meta: null, value: ''},
    'should support a pre w/o alt, value'
  )

  t.deepEqual(
    toMdast({type: 'pre', alt: 'a'}),
    {type: 'code', lang: 'a', meta: null, value: ''},
    'should support a pre w/ alt, w/o value'
  )

  t.deepEqual(
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
    toMdast({type: 'root'}),
    {type: 'root', children: []},
    'should support an empty root (1)'
  )

  t.deepEqual(
    toMdast({type: 'root', children: []}),
    {type: 'root', children: []},
    'should support an empty root (2)'
  )

  t.deepEqual(
    toMdast({type: 'root', children: [{type: 'text', value: 'a'}]}),
    {
      type: 'root',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    },
    'should support a root w/ content'
  )

  t.deepEqual(
    toMdast({
      type: 'root',
      children: [
        {type: 'text', value: 'a'},
        {type: 'text', value: 'b'},
        {type: 'break'},
        {type: 'pre', value: 'c\n\nd'},
        {type: 'break'},
        {type: 'list', children: [{type: 'listItem', value: 'e'}]},
        // These two will be ignored:
        {type: 'text'},
        {type: 'text'},
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
