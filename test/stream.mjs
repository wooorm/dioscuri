'use strict'

import fs from 'fs'
import {PassThrough} from 'stream'
import test from 'tape'
import concat from 'concat-stream'
import {stream} from '../index.mjs'

test('stream', function (t) {
  var s
  var phase

  t.plan(13)

  slowStream('* a\n\n> b\n* c\nd\n* e\n* b\n# f')
    .pipe(stream())
    .pipe(concat(onconcat1))

  function onconcat1(result) {
    t.equal(
      result,
      [
        '<ul>',
        '<li>a</li>',
        '</ul>',
        '<br />',
        '<blockquote>',
        '<p>b</p>',
        '</blockquote>',
        '<ul>',
        '<li>c</li>',
        '</ul>',
        '<p>d</p>',
        '<ul>',
        '<li>e</li>',
        '<li>b</li>',
        '</ul>',
        '<h1>f</h1>'
      ].join('\n'),
      'should support streaming'
    )
  }

  slowStream(Buffer.from('> a\n* b')).pipe(stream()).pipe(concat(onconcat2))

  function onconcat2(result) {
    t.equal(
      result,
      '<blockquote>\n<p>a</p>\n</blockquote>\n<ul>\n<li>b</li>\n</ul>',
      'should support streaming buffers'
    )
  }

  slowStream(Buffer.from('> a\r\n\r\r\nb'))
    .pipe(stream())
    .pipe(concat(onconcat3))

  function onconcat3(result) {
    t.equal(
      result,
      '<blockquote>\r\n<p>a</p>\r\n</blockquote>\r\n<p>\r</p>\r\n<p>b</p>',
      'should support CRLFs'
    )
  }

  fs.writeFileSync('integrate-input', '#∵')

  fs.createReadStream('integrate-input')
    .pipe(stream())
    .pipe(fs.createWriteStream('integrate-output'))
    .on('close', onend1)

  function onend1() {
    t.equal(
      String(fs.readFileSync('integrate-output')),
      '<h1>∵</h1>',
      'should support stdin'
    )

    fs.unlinkSync('integrate-input')
    fs.unlinkSync('integrate-output')
  }

  t.equal(stream().end(), true, 'should return true for `end`')

  t.throws(
    function () {
      var tr = stream()
      tr.end()
      tr.end()
    },
    /^Error: Did not expect `write` after `end`$/,
    'should throw on end after end'
  )

  s = stream()
  s.pipe(
    concat(function (value) {
      t.equal(String(value), '', 'should end w/o ever receiving data')
    })
  )
  s.end()

  s = stream()
  s.pipe(
    concat(function (value) {
      t.equal(String(value), '<p>x</p>', 'should end')
    }),
    {end: true}
  )
  s.end('x')

  s = stream()
  s.pipe(
    concat(function (value) {
      t.equal(
        String(value),
        '<p>alpha</p>',
        'should receive final data from `end`'
      )
    })
  )
  s.end('alpha')

  s = stream()
  s.pipe(
    concat(function (value) {
      t.equal(String(value), '<p>brC!vo</p>', 'should honour encoding')
    })
  )
  s.end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

  phase = 0

  s = stream()
  s.pipe(
    concat(function () {
      t.equal(phase, 1, 'should trigger data after callback')
      phase++
    })
  )
  s.end('charlie', function () {
    t.equal(phase, 0, 'should trigger callback before data')
    phase++
  })

  s = stream()
  s.pipe(new PassThrough())

  t.throws(
    function () {
      s.emit('error', new Error('Whoops!'))
    },
    /Whoops!/,
    'should throw if errors are not listened to'
  )
})

function slowStream(value, encoding) {
  var stream = new PassThrough()
  var index = 0

  setImmediate(send)

  return stream

  function send() {
    if (index === value.length) {
      stream.end()
    } else {
      stream.write(value.slice(index, ++index), encoding)
      setImmediate(send)
    }
  }
}
