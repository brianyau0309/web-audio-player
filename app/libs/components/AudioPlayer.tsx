'use client'

import { use, useEffect, useRef, useState } from 'react'
import { AudioPlayerContext } from '../state/audio-player'
import { Button } from './Button'

export const AudioPlayer = () => {
  const {
    playlistState: { audio },
    nextAudio,
  } = use(AudioPlayerContext)
  const [audioInfo, setAudioInfo] = useState<{
    currentTime: number
    duration: number
    buffered: number
  }>({ currentTime: 0, duration: 0, buffered: 0 })
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!audio) return
    audioRef.current?.play()
    audio.play()

    if ('mediaSession' in navigator) {
      const actions: Array<{
        action: MediaSessionAction
        handler: MediaSessionActionHandler
      }> = [
        {
          action: 'play',
          handler: () => {
            audioRef.current?.play()
            audio.play()
          },
        },
        {
          action: 'pause',
          handler: () => {
            audioRef.current?.pause()
            audio.pause()
          },
        },
        { action: 'nexttrack', handler: () => nextAudio() },
        {
          action: 'previoustrack',
          handler: () => nextAudio((i) => i - 1),
        },
        {
          action: 'seekforward',
          handler: (evt) => {
            console.debug('forward offset', evt.seekOffset)
            const offset = evt.seekOffset
            // FIXME: Offset is not working, evt.seekOffset is always undefined
            if (offset) audio.seek((curr) => curr + offset)
            else audio.seek((curr, d) => Math.min(d, curr + 3))
          },
        },
        {
          action: 'seekbackward',
          handler: (evt) => {
            console.debug('backward', evt.seekOffset)
            const offset = evt.seekOffset
            // FIXME: Offset is not working, evt.seekOffset is always undefined
            if (offset) audio.seek((curr) => curr - offset)
            else audio.seek((curr) => Math.max(0, curr - 3))
          },
        },
        {
          action: 'seekto',
          handler: (evt) => {
            // seekTime only work on mobile but not work on desktop
            const time = evt.seekTime
            if (time) audio.seek(() => Math.max(0, Math.floor(time)))
          },
        },
      ]
      for (const { action, handler } of actions) {
        navigator.mediaSession.setActionHandler(action, handler)
      }
    }

    const ac = new AbortController()
    audio.target.addEventListener(
      'tick',
      () => {
        setAudioInfo({
          currentTime: audio.currentTime,
          duration: audio.duration,
          buffered: audio.buffered,
        })
        // audio.setMediaPositionState()
        if ('mediaSession' in navigator) {
          console.info(
            'inline info',
            Math.ceil(audio.currentTime),
            Math.floor(audio.duration),
          )
          navigator.mediaSession.setPositionState({
            duration: Math.floor(audio.duration),
            playbackRate: 1,
            position: Math.ceil(audio.currentTime),
          })
        }
      },
      { signal: ac.signal },
    )
    audio.target.addEventListener('ended', () => nextAudio(), {
      signal: ac.signal,
    })
    return () => {
      ac.abort()
      audio.stop()
    }
    // FIXME: Not putting nextAudio as a dependency to prevent unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio])

  return (
    <div className="fixed bottom-0 left-0 z-40 flex w-full">
      {audio && (
        <div>
          <Button
            variant="primary"
            onClick={() => {
              audioRef.current?.play()
              audio.play()
            }}
          >
            Play
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              audioRef.current?.pause()
              audio.pause()
            }}
          >
            Pause
          </Button>
          <Button
            variant="primary"
            onClick={() => audio.seek((curr) => curr + 10)}
          >
            Fastforward 10
          </Button>
          <Button variant="primary" onClick={() => audio.seek(() => 0)}>
            Back to 0
          </Button>
          <div>
            {audioInfo.currentTime.toFixed(2)} / {audioInfo.duration.toFixed(2)}{' '}
            ({audioInfo.buffered.toFixed(2)})
          </div>
        </div>
      )}
      <audio ref={audioRef} src="/silence.mp3" loop />
    </div>
  )
}
