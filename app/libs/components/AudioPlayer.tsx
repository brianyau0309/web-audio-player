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
    const ac = new AbortController()
    audio.target.addEventListener(
      'tick',
      () => {
        setAudioInfo({
          currentTime: audio.currentTime,
          duration: audio.duration,
          buffered: audio.buffered,
        })
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
  }, [audio, nextAudio])

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
          <Button variant="primary" onClick={() => audio.seek(160)}>
            Seek 100
          </Button>
          <div>
            {audioInfo.currentTime.toFixed(2)} / {audioInfo.duration.toFixed(2)}{' '}
            ({audioInfo.buffered.toFixed(2)})
          </div>
        </div>
      )}
      <audio ref={audioRef} src="/silence.mp3" controls loop />
    </div>
  )
}
