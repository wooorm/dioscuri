import EventEmitter from 'events'
import {compiler} from './compiler.js'
import {parser} from './parser.js'

/**
 * @param {import('./compiler.js').Options} [options]
 * @returns {import('events').EventEmitter}
 */
export function stream(options) {
  var parse = parser()
  var compile = compiler(options)
  var emitter = new EventEmitter()
  /** @type {boolean} */
  var ended

  // @ts-ignore add extra attributes.
  emitter.writable = true
  // @ts-ignore add extra attributes.
  emitter.readable = true
  // @ts-ignore only implement one of the write interfaces
  emitter.write = write
  // @ts-ignore only implement one of the end interfaces
  emitter.end = end
  // @ts-ignore add extra attributes.
  emitter.pipe = pipe

  return emitter

  /**
   * @param {import('./parser').Buf} chunk
   * @param {import('./parser').BufferEncoding} [encoding]
   * @param {((error?: Error) => void)} [callback]
   * @param {boolean?} [end]
   */
  function write(chunk, encoding, callback, end) {
    if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }

    if (ended) {
      throw new Error('Did not expect `write` after `end`')
    }

    emitter.emit('data', compile(parse(chunk, encoding, end)))

    if (callback) {
      callback()
    }

    // Signal successful write.
    return true
  }

  /**
   * @param {import('./parser').Buf} chunk
   * @param {import('./parser').BufferEncoding} [encoding]
   * @param {(() => void)} [callback]
   */
  function end(chunk, encoding, callback) {
    write(chunk, encoding, callback, true)
    emitter.emit('end')
    ended = true
    return true
  }

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

    // @ts-ignore If the `end` option is not supplied, `dest.end()` will be
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
