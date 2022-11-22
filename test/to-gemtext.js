import assert from 'node:assert/strict'
import test from 'node:test'
import {toGemtext} from '../index.js'

test('toGemtext', () => {
  assert.throws(
    () => {
      // @ts-expect-error: custom node.
      toGemtext({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on unknown nodes'
  )

  assert.throws(
    () => {
      // @ts-expect-error: invalid node.
      toGemtext({})
    },
    /Cannot handle value `\[object Object]`, expected node/,
    'should throw on non-nodes'
  )

  assert.equal(toGemtext({type: 'break'}), '\n', 'should support a break')

  assert.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'text'}),
    '',
    'should support a text w/o content'
  )

  assert.equal(
    toGemtext({type: 'text', value: 'alpha'}),
    'alpha',
    'should support a text w/ content'
  )

  assert.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'heading'}),
    '#',
    'should support a heading w/o rank'
  )

  assert.equal(
    // @ts-expect-error: `rank` too high.
    toGemtext({type: 'heading', rank: 4}),
    '###',
    'should cap headings to rank 3'
  )

  assert.equal(
    // @ts-expect-error: `rank` missing.
    toGemtext({type: 'heading', value: 'a'}),
    '# a',
    'should support a heading w/ value'
  )

  // @ts-expect-error: `url`, `value` missing.
  assert.equal(toGemtext({type: 'link'}), '=>', 'should support a link w/o url')

  assert.equal(
    // @ts-expect-error: `url` missing.
    toGemtext({type: 'link', value: 'a'}),
    '=>',
    'should ignore `value` of a link w/o url'
  )

  assert.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'link', url: 'a'}),
    '=> a',
    'should support a link w/ url'
  )

  assert.equal(
    toGemtext({type: 'link', url: 'a', value: 'b'}),
    '=> a b',
    'should support a link w/ url, value'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    toGemtext({type: 'list'}),
    '*',
    'should support a list w/o children'
  )

  assert.equal(
    toGemtext({type: 'list', children: []}),
    '*',
    'should support a list w/ no children'
  )

  assert.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'list', children: [{type: 'listItem'}]}),
    '*',
    'should support a list w/ a child'
  )

  /** @type {import('../lib/gtast.js').ListItem} */
  const item = {type: 'listItem', value: 'a'}

  assert.equal(
    toGemtext({type: 'list', children: [item]}),
    '* a',
    'should support a list w/ a child w/ a value'
  )

  /** @type {Array<import('../lib/gtast.js').ListItem>} */
  const items = [
    {type: 'listItem', value: 'a'},
    {type: 'listItem', value: ''},
    {type: 'listItem', value: 'b'}
  ]

  assert.equal(
    toGemtext({type: 'list', children: items}),
    '* a\n*\n* b',
    'should support a list w/ children'
  )

  assert.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'pre'}),
    '```\n```',
    'should support a pre w/o alt, value'
  )

  assert.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'pre', alt: 'a'}),
    '```a\n```',
    'should support a pre w/ alt, w/o value'
  )

  assert.equal(
    toGemtext({type: 'pre', value: 'a'}),
    '```\na\n```',
    'should support a pre w/o alt, w/ value'
  )

  assert.equal(
    toGemtext({type: 'pre', alt: 'a', value: 'b\nc'}),
    '```a\nb\nc\n```',
    'should support a pre w/ alt, value'
  )

  assert.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'quote'}),
    '>',
    'should support a quote w/o value'
  )

  assert.equal(
    toGemtext({type: 'quote', value: 'a'}),
    '> a',
    'should support a quote w/ value'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    toGemtext({type: 'root'}),
    '',
    'should support an empty root (1)'
  )

  assert.equal(
    toGemtext({type: 'root', children: []}),
    '',
    'should support an empty root (2)'
  )

  /** @type {import('../lib/gtast.js').Text} */
  const text = {type: 'text', value: 'a'}

  assert.equal(
    toGemtext({type: 'root', children: [text]}),
    'a\n',
    'should support a root w/ content'
  )

  /** @type {import('../lib/gtast.js').ListItem} */
  const itemE = {type: 'listItem', value: 'e'}

  assert.equal(
    toGemtext({
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
        {type: 'heading', rank: 1, value: 'f'},
        {type: 'text', value: 'g'}
      ]
    }),
    'a\nb\n\n```\nc\n\nd\n```\n\n* e\n# f\ng\n',
    'should support a root w/ lots of content'
  )
})
