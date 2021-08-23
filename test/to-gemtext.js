import test from 'tape'
import {toGemtext} from '../index.js'

test('toGemtext', (t) => {
  t.throws(
    () => {
      // @ts-expect-error: custom node.
      toGemtext({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on unknown nodes'
  )

  t.throws(
    () => {
      // @ts-expect-error: invalid node.
      toGemtext({})
    },
    /Cannot handle value `\[object Object]`, expected node/,
    'should throw on non-nodes'
  )

  t.equal(toGemtext({type: 'break'}), '\n', 'should support a break')

  // @ts-expect-error: `value` missing.
  t.equal(toGemtext({type: 'text'}), '', 'should support a text w/o content')

  t.equal(
    toGemtext({type: 'text', value: 'alpha'}),
    'alpha',
    'should support a text w/ content'
  )

  t.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'heading'}),
    '#',
    'should support a heading w/o rank'
  )

  t.equal(
    // @ts-expect-error: `rank` too high.
    toGemtext({type: 'heading', rank: 4}),
    '###',
    'should cap headings to rank 3'
  )

  t.equal(
    // @ts-expect-error: `rank` missing.
    toGemtext({type: 'heading', value: 'a'}),
    '# a',
    'should support a heading w/ value'
  )

  // @ts-expect-error: `url`, `value` missing.
  t.equal(toGemtext({type: 'link'}), '=>', 'should support a link w/o url')

  t.equal(
    // @ts-expect-error: `url` missing.
    toGemtext({type: 'link', value: 'a'}),
    '=>',
    'should ignore `value` of a link w/o url'
  )

  t.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'link', url: 'a'}),
    '=> a',
    'should support a link w/ url'
  )

  t.equal(
    toGemtext({type: 'link', url: 'a', value: 'b'}),
    '=> a b',
    'should support a link w/ url, value'
  )

  // @ts-expect-error: `children` missing.
  t.equal(toGemtext({type: 'list'}), '*', 'should support a list w/o children')

  t.equal(
    toGemtext({type: 'list', children: []}),
    '*',
    'should support a list w/ no children'
  )

  t.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'list', children: [{type: 'listItem'}]}),
    '*',
    'should support a list w/ a child'
  )

  t.equal(
    toGemtext({type: 'list', children: [{type: 'listItem', value: 'a'}]}),
    '* a',
    'should support a list w/ a child w/ a value'
  )

  t.equal(
    toGemtext({
      type: 'list',
      children: [
        {type: 'listItem', value: 'a'},
        {type: 'listItem', value: ''},
        {type: 'listItem', value: 'b'}
      ]
    }),
    '* a\n*\n* b',
    'should support a list w/ children'
  )

  t.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'pre'}),
    '```\n```',
    'should support a pre w/o alt, value'
  )

  t.equal(
    // @ts-expect-error: `value` missing.
    toGemtext({type: 'pre', alt: 'a'}),
    '```a\n```',
    'should support a pre w/ alt, w/o value'
  )

  t.equal(
    toGemtext({type: 'pre', value: 'a'}),
    '```\na\n```',
    'should support a pre w/o alt, w/ value'
  )

  t.equal(
    toGemtext({type: 'pre', alt: 'a', value: 'b\nc'}),
    '```a\nb\nc\n```',
    'should support a pre w/ alt, value'
  )

  // @ts-expect-error: `value` missing.
  t.equal(toGemtext({type: 'quote'}), '>', 'should support a quote w/o value')

  t.equal(
    toGemtext({type: 'quote', value: 'a'}),
    '> a',
    'should support a quote w/ value'
  )

  // @ts-expect-error: `children` missing.
  t.equal(toGemtext({type: 'root'}), '', 'should support an empty root (1)')

  t.equal(
    toGemtext({type: 'root', children: []}),
    '',
    'should support an empty root (2)'
  )

  t.equal(
    toGemtext({type: 'root', children: [{type: 'text', value: 'a'}]}),
    'a\n',
    'should support a root w/ content'
  )

  t.equal(
    toGemtext({
      type: 'root',
      children: [
        {type: 'text', value: 'a'},
        {type: 'text', value: 'b'},
        {type: 'break'},
        {type: 'pre', value: 'c\n\nd'},
        {type: 'break'},
        {type: 'list', children: [{type: 'listItem', value: 'e'}]},
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

  t.end()
})
