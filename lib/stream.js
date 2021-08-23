/**
 * @typedef {import('./compiler.js').Options} Options
 * @typedef {import('./parser').Buf} Value
 * @typedef {import('./parser').BufferEncoding} Encoding
 */

/**
 * @typedef {((error?: Error) => void)} Callback
 * @typedef {Omit<NodeJS.ReadableStream & NodeJS.WritableStream, 'read'|'setEncoding'|'pause'|'resume'|'isPaused'|'unpipe'|'unshift'|'wrap'>} MinimalDuplex
 */

import EventEmitter from 'events'
import {compiler} from './compiler.js'
import {parser} from './parser.js'

/**
 * @param {Options} [options]
 * @returns {MinimalDuplex}
 */
export function stream(options) {
  var parse = parser()
  var compile = compiler(options)
  /** @type {boolean} */
  var ended

  /**
   * Write a chunk into memory.
   *
   * @param {Value} chunk
   * @param {Encoding} encoding
   * @param {Callback} callback
   */
  const write =
    /**
     * @type {(
     *   ((value?: Value, encoding?: Encoding, callback?: Callback) => boolean) &
     *   ((value: Value, callback?: Callback) => boolean)
     * )}
     */
    (
      /**
       * @param {Value} [chunk]
       * @param {Encoding} [encoding]
       * @param {Callback} [callback]
       */
      function (chunk, encoding, callback) {
        if (typeof encoding === 'function') {
          callback = encoding
          encoding = undefined
        }

        if (ended) {
          throw new Error('Did not expect `write` after `end`')
        }

        emitter.emit('data', compile(parse(chunk, encoding)))

        if (callback) {
          callback()
        }

        // Signal succesful write.
        return true
      }
    )

  /**
   * End the writing.
   * Passes all arguments to a final `write`.
   *
   * @param {Value} chunk
   * @param {Encoding} encoding
   * @param {Callback} callback
   */
  const end =
    /**
     * @type {(
     *   ((value?: Value, encoding?: Encoding, callback?: Callback) => boolean) &
     *   ((value: Value, callback?: Callback) => boolean)
     * )}
     */
    (
      /**
       * @param {Value} [chunk]
       * @param {Encoding} [encoding]
       * @param {Callback} [callback]
       */
      function (chunk, encoding, callback) {
        if (typeof encoding === 'function') {
          callback = encoding
          encoding = undefined
        }

        if (ended) {
          throw new Error('Did not expect `write` after `end`')
        }

        emitter.emit('data', compile(parse(chunk, encoding, true)))

        if (callback) {
          callback()
        }

        emitter.emit('end')
        ended = true
        return true
      }
    )

  /** @type {MinimalDuplex} */
  // @ts-expect-error `addListener` is fine.
  const emitter = Object.assign(new EventEmitter(), {
    writable: true,
    readable: true,
    write,
    end,
    pipe
  })

  return emitter

  // Pipe the processor into a writable stream.
  // Basically `Stream#pipe`, but inlined and simplified to keep the bundled
  // size down.
  // See: <https://github.com/nodejs/node/blob/43a5170/lib/internal/streams/legacy.js#L13>.
  /**
   * @template {NodeJS.WritableStream} T
   * @param {T} dest
   * @param {{end?: boolean}} [options]
   * @returns {T}
   */
  function pipe(dest, options) {
    emitter.on('data', ondata)
    emitter.on('error', onerror)
    emitter.on('end', cleanup)
    emitter.on('close', cleanup)

    // @ts-expect-error If the `end` option is not supplied, `dest.end()` will be
    // called when the `end` or `close` events are received.
    if (!dest._isStdio && (!options || options.end !== false)) {
      emitter.on('end', onend)
    }

    dest.on('error', onerror)
    dest.on('close', cleanup)

    dest.emit('pipe', emitter)

    return dest

    function onend() {
      if (dest.end) {
        dest.end()
      }
    }

    /**
     * @param {string} chunk
     */
    function ondata(chunk) {
      if (dest.writable) {
        dest.write(chunk)
      }
    }

    // Clean listeners.
    function cleanup() {
      emitter.removeListener('data', ondata)
      emitter.removeListener('end', onend)
      emitter.removeListener('error', onerror)
      emitter.removeListener('end', cleanup)
      emitter.removeListener('close', cleanup)

      dest.removeListener('error', onerror)
      dest.removeListener('close', cleanup)
    }

    /**
     * Close dangling pipes and handle unheard errors.
     *
     * @param {Error} error
     */
    function onerror(error) {
      cleanup()

      if (!emitter.listenerCount('error')) {
        throw error // Unhandled stream error in pipe.
      }
    }
  }
}
