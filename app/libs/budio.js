/**
 * @typedef {{start: number, end: number}} Range
 * @typedef {('NotInitialized'|'Playing'|'Paused'|'PlayAfterBuffering'|'Stopped'|'Ended')} PlayState
 * @typedef {(range?: Range) => Promise<ArrayBuffer>} AudioFetcher
 * */

export class BudioError extends Error {}

export class Budio {
  /** @type {AudioFetcher} */
  #audioFetcher

  /** @type {AudioContext} */
  #audioCtx

  /** @readonly */
  target = new EventTarget()

  /** @type {AbortController} */
  #abortCtrl = new AbortController()

  /** @type {number} */
  #startAt = 0

  /** @type {number} */
  #pauseAt = 0

  /** @type {ArrayBuffer | null} */
  #buffer = null

  /** @type {AudioBuffer | null} */
  #audioBuffer = null

  /** @type {AudioBufferSourceNode | null} */
  #node = null

  /** @type {PlayState} */
  #playState = 'NotInitialized'

  /** @type {Set<number>} */
  #timers = new Set()

  /** @type {boolean} */
  #bufferable = false

  /** @type {number} */
  #duration = 0

  /** @readonly @type {number} */
  #fetchSize = 1 * 1024 * 1024 // 1MB

  /**
   * @readonly
   * @param {AudioContext} audioCtx
   * @param {AudioFetcher} audioFetcher
   * @param {Object} opts
   * @param {boolean} [opts.bufferable]
   * @param {number} [opts.duration]
   * @param {MediaMetadata} [opts.mediaMetadata]
   * */
  constructor(audioCtx, audioFetcher, opts = {}) {
    /** @readonly @type {AudioContext} */
    this.#audioCtx = audioCtx
    this.#audioFetcher = audioFetcher

    if (opts.bufferable && opts.duration != null) {
      this.#bufferable = opts.bufferable
      this.#duration = opts.duration
    }

    if (opts.mediaMetadata && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = opts.mediaMetadata
    }
  }

  /* Getters */

  /** @readonly */
  get playState() {
    return this.#playState
  }

  /** @readonly */
  get duration() {
    return this.#duration
  }

  /** @readonly */
  get buffered() {
    if (!this.#audioBuffer) return 0
    return this.#audioBuffer.duration
  }

  /** @readonly */
  get currentTime() {
    if (!this.#audioBuffer) return 0
    switch (this.#playState) {
      case 'Playing':
        return this.#audioCtx.currentTime - this.#startAt
      case 'PlayAfterBuffering':
      case 'Paused':
        return this.#pauseAt
      case 'Stopped':
        return 0
      case 'Ended':
        return this.duration
      default:
        throw new BudioError('Unknown play state')
    }
  }

  /* Private Methods */

  /**
   * @param {ArrayBuffer} b1
   * @param {ArrayBuffer} b2
   * @returns {ArrayBufferLike}
   */
  #appendBuffer(b1, b2) {
    const tmp = new Uint8Array(b1.byteLength + b2.byteLength)
    tmp.set(new Uint8Array(b1), 0)
    tmp.set(new Uint8Array(b2), b1.byteLength)
    return tmp.buffer
  }

  /** @readonly */
  async #fetchNewBuffer() {
    console.debug('fetch new buffer')
    if (!this.#buffer) return
    const newBuffer = await this.#audioFetcher({
      start: this.#buffer.byteLength,
      end: this.#buffer.byteLength + this.#fetchSize,
    })
    this.#buffer = this.#appendBuffer(this.#buffer, newBuffer)
    console.debug('fetched new buffer')
  }

  /** @readonly */
  #setTickTimer() {
    this.#timers.add(
      window.setInterval(async () => {
        this.target.dispatchEvent(new Event('tick'))
      }, 1000),
    )
  }

  /** @readonly */
  #setBufferingTimer() {
    // console.debug("set buffering timer");
    const t = window.setInterval(async () => {
      if (!this.#audioBuffer || !this.#buffer) return clearInterval(t)
      console.debug(
        t,
        'check buffering',
        this.currentTime / this.#audioBuffer.duration,
      )
      if (this.currentTime / this.#audioBuffer.duration > 0.75) {
        clearInterval(t)
        this.#timers.delete(t)
        console.debug('Reaching 75% of audio, start buffering')
        await this.#fetchNewBuffer()
        console.debug('Create new audio buffer')
        const audioBuffer = await this.#audioCtx.decodeAudioData(
          this.#buffer.slice(0),
        )
        console.debug('Create new buffer source node')
        if (['Playing', 'PlayAfterBuffering'].includes(this.#playState)) {
          console.debug('Continue playing after buffering')
          const abortCtrl = new AbortController()
          const node = this.#createNode(audioBuffer, abortCtrl)
          this.#abortCtrl.abort()
          this.#node?.stop()
          node.start(0, this.currentTime)
          console.debug('Clean current props and set new props')
          this.#abortCtrl = abortCtrl
          this.#audioBuffer = audioBuffer
          this.#node = node
          if (audioBuffer.duration >= this.duration) {
            this.#bufferable = false
          } else {
            this.#setBufferingTimer()
          }
        } else {
          const node = this.#createNode(audioBuffer, this.#abortCtrl)
          this.#audioBuffer = audioBuffer
          this.#node = node
          if (audioBuffer.duration >= this.duration) {
            this.#bufferable = false
          }
        }
      }
    }, 1000)
    this.#timers.add(t)
  }

  /** @readonly
   * @param {AudioBuffer} audioBuffer
   * @param {AbortController} abortCtrl
   **/
  #createNode(audioBuffer, abortCtrl) {
    console.debug('careate buffer source node')
    const node = this.#audioCtx.createBufferSource()
    node.buffer = audioBuffer
    node.connect(this.#audioCtx.destination)
    node.addEventListener(
      'ended',
      () => {
        const currentTime = Math.ceil(this.currentTime)
        const duration = Math.floor(this.duration)
        if (currentTime >= duration) this.#end()
        else {
          console.log(currentTime, duration)
          this.pause()
          this.#playState = 'PlayAfterBuffering'
        }
      },
      { signal: abortCtrl.signal },
    )
    return node
  }

  /** @readonly */
  #cleanCurrentNode() {
    this.#node?.stop()
    this.#node?.disconnect()
    this.#node = null
    this.#abortCtrl.abort()
    this.#abortCtrl = new AbortController()
    this.#timers.forEach((t) => clearInterval(t))
    this.#timers.clear()
  }

  /** @readonly */
  async #end() {
    console.debug('end')
    this.#cleanCurrentNode()
    this.#playState = 'Ended'
    this.target.dispatchEvent(new Event('ended'))
    if ('mediaSession' in navigator)
      navigator.mediaSession.playbackState = 'paused'
  }

  /** @readonly */
  setMediaPositionState() {
    console.info(
      'setMediaPositionState',
      Math.ceil(this.currentTime),
      Math.floor(this.duration),
    )
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setPositionState({
        duration: Math.floor(this.duration),
        playbackRate: 1,
        position: Math.max(
          Math.floor(this.duration),
          Math.ceil(this.currentTime),
        ),
      })
    }
  }

  /* Public Methods */

  async init() {
    console.debug('init')
    if (this.#playState !== 'NotInitialized')
      throw new BudioError('Already initialized')

    console.debug('fetchBuffer')
    if (this.#bufferable)
      this.#buffer = await this.#audioFetcher({
        start: 0,
        end: this.#fetchSize,
      })
    else this.#buffer = await this.#audioFetcher()

    console.debug('decodeAudioData')
    do {
      if (this.#audioBuffer != null) await this.#fetchNewBuffer()
      this.#audioBuffer = await this.#audioCtx.decodeAudioData(
        this.#buffer.slice(0),
      )
      if (this.#audioBuffer.duration >= this.duration) this.#bufferable = false
    } while (this.#audioBuffer.duration < 10 && this.#bufferable)

    if (!this.#bufferable) this.#duration = this.#audioBuffer.duration
    this.#playState = 'Stopped'
  }

  /** @readonly @param {number} [time]  */
  async play(time) {
    console.debug('play')
    if (!this.#audioBuffer) await this.init()
    if (!this.#audioBuffer) throw new BudioError('AudioBuffer is not ready')
    if (this.#playState === 'Playing') return
    if (time != null) this.pauseAt = time

    this.#node = this.#createNode(this.#audioBuffer, this.#abortCtrl)
    this.#node.start(0, this.#pauseAt)

    this.#startAt = this.#audioCtx.currentTime - this.#pauseAt
    this.#playState = 'Playing'
    this.#setTickTimer()
    if (this.#bufferable) this.#setBufferingTimer()
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing'
      this.setMediaPositionState()
    }
  }

  /** @readonly */
  async pause() {
    console.debug('pause')
    if (!['Playing', 'PlayAfterBuffering'].includes(this.#playState))
      throw new BudioError('Budio is not playing')
    this.#cleanCurrentNode()
    this.#pauseAt = this.currentTime
    this.#playState = 'Paused'
    if ('mediaSession' in navigator)
      navigator.mediaSession.playbackState = 'paused'
  }

  /** @readonly */
  async stop() {
    console.debug('stop')
    this.#cleanCurrentNode()
    this.#startAt = 0
    this.#pauseAt = 0
    this.#playState = 'Stopped'
  }

  /** @readonly @param {(currentTime: number, duration: number) => number} timeHandler  */
  async seek(timeHandler) {
    const time = timeHandler(this.currentTime, this.duration)
    console.debug('seek to', time)
    if (!['Playing', 'Paused', 'PlayAfterBuffering'].includes(this.#playState))
      throw new BudioError(
        `Seek is not allowed when budio is ${this.#playState}`,
      )
    if (!this.#audioBuffer) await this.init()
    if (!this.#audioBuffer) throw new BudioError('AudioBuffer is not ready')
    if (time < 0) throw new BudioError(`Invalid time ${time} < 0`)
    if (this.#audioBuffer.duration < time)
      throw new BudioError(`Invalid time ${time} > druation`)

    if (this.#playState === 'Playing') {
      this.#cleanCurrentNode()
      this.#node = this.#createNode(this.#audioBuffer, this.#abortCtrl)
      this.#node.start(0, time)
      this.#startAt = this.#audioCtx.currentTime - time
      this.#setTickTimer()
      if (this.#bufferable) this.#setBufferingTimer()
      this.setMediaPositionState()
    } else {
      this.#pauseAt = time
    }
  }
}
