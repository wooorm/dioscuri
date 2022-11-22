/**
 * @typedef {import('../lib/parser.js').BufferEncoding} Encoding
 */

import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import {createReadStream, createWriteStream, promises as fs} from 'node:fs'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import concat from 'concat-stream'
import {stream} from '../index.js'

test('stream', async () => {
  await new Promise((resolve) => {
    slowStream('* a\n\n> b\n* c\nd\n* e\n* b\n# f')
      .pipe(stream())
      .pipe(
        concat(function (result) {
          assert.equal(
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
          resolve(undefined)
        })
      )
  })

  await new Promise((resolve) => {
    slowStream(Buffer.from('> a\n* b'))
      .pipe(stream())
      .pipe(
        concat(function (result) {
          assert.equal(
            result,
            '<blockquote>\n<p>a</p>\n</blockquote>\n<ul>\n<li>b</li>\n</ul>',
            'should support streaming buffers'
          )
          resolve(undefined)
        })
      )
  })

  await new Promise((resolve) => {
    slowStream(Buffer.from('> a\r\n\r\r\nb'))
      .pipe(stream())
      .pipe(
        concat(function (result) {
          assert.equal(
            result,
            '<blockquote>\r\n<p>a</p>\r\n</blockquote>\r\n<p>\r</p>\r\n<p>b</p>',
            'should support CRLFs'
          )
          resolve(undefined)
        })
      )
  })

  await (async () => {
    await fs.writeFile('integrate-input', '#∵')

    createReadStream('integrate-input')
      .pipe(stream())
      .pipe(createWriteStream('integrate-output'))
      .on('close', async function () {
        const input = String(await fs.readFile('integrate-output'))
        assert.equal(input, '<h1>∵</h1>', 'should support stdin')

        await fs.unlink('integrate-input')
        await fs.unlink('integrate-output')
      })
  })()

  assert.equal(stream().end(), true, 'should return true for `end`')

  assert.throws(
    () => {
      const tr = stream()
      tr.end()
      tr.write('')
    },
    /^Error: Did not expect `write` after `end`$/,
    'should throw on write after end'
  )

  assert.throws(
    () => {
      const tr = stream()
      tr.end()
      tr.end()
    },
    /^Error: Did not expect `write` after `end`$/,
    'should throw on end after end'
  )

  await new Promise((resolve) => {
    const s = stream()
    s.pipe(
      concat((value) => {
        assert.equal(String(value), '', 'should end w/o ever receiving data')
        resolve(undefined)
      })
    )
    s.end()
  })

  await new Promise((resolve) => {
    const s = stream()
    s.pipe(
      concat((value) => {
        assert.equal(String(value), '<p>x</p>', 'should end')
        resolve(undefined)
      }),
      {end: true}
    )
    s.end('x')
  })

  await new Promise((resolve) => {
    const s = stream()
    s.pipe(
      concat((value) => {
        assert.equal(
          String(value),
          '<p>alpha</p>',
          'should receive final data from `end`'
        )
        resolve(undefined)
      })
    )
    s.end('alpha')
  })

  await new Promise((resolve) => {
    const s = stream()
    s.pipe(
      concat((value) => {
        assert.equal(String(value), '<p>brC!vo</p>', 'should honour encoding')
        resolve(undefined)
      })
    )

    // @ts-expect-error: buffer is okay.
    s.end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')
  })

  await new Promise((resolve) => {
    let phase = 0

    const s = stream()
    s.pipe(
      concat(() => {
        assert.equal(phase, 1, 'should trigger data after callback')
        phase++
        resolve(undefined)
      })
    )
    s.end('charlie', () => {
      assert.equal(phase, 0, 'should trigger callback before data')
      phase++
    })
  })

  await new Promise((resolve) => {
    const s = stream()
    s.write('charlie', () => {
      resolve(undefined)
    })
  })

  await new Promise((resolve) => {
    const s = stream()
    s.pipe(new PassThrough())

    assert.throws(
      () => {
        s.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )
    resolve(undefined)
  })
})

/**
 * @param {string|Buffer} value
 * @param {Encoding} [encoding]
 */
function slowStream(value, encoding) {
  const stream = new PassThrough()
  let index = 0

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
