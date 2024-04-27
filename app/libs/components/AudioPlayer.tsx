'use client'

import { use, useEffect, useRef, useState } from 'react'
import { AudioPlayerContext } from '../state/audio-player'
import { Button } from './Button'
// @ts-ignore
import SecCon from 'sec-con'
import Play from './icons/Play'
import Pause from './icons/Pause'

export const AudioPlayer = () => {
  const {
    playlistState: { playlist, curIndex, audio },
    nextAudio,
  } = use(AudioPlayerContext)
  const [audioInfo, setAudioInfo] = useState<{
    currentTime: number
    duration: number
    buffered: number
  }>({ currentTime: 0, duration: 0, buffered: 0 })
  const [isSliding, setIsSliding] = useState(false)
  const [pgVal, setPgVal] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const updateAudioInfo = () => {
    if (!audio) return
    setAudioInfo({
      currentTime: audio.currentTime,
      duration: audio.duration,
      buffered: audio.buffered,
    })
    audio.setMediaPositionState()
  }

  const onSlideStart = (
    e: React.TouchEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>,
  ) => {
    if ('value' in e.target && typeof e.target.value === 'string') {
      console.debug('down', e.target.value)
      setPgVal(parseInt(e.target.value))
      setIsSliding(true)
    }
  }
  const onSlideEnd = (
    e: React.TouchEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>,
  ) => {
    if (audio && 'value' in e.target && typeof e.target.value === 'string') {
      console.debug('up', e.target.value)
      const val = e.target.value
      audio.seek(() => parseInt(val))
      updateAudioInfo()
      setIsSliding(false)
    }
  }

  const playToggle = () => {
    if (audio) {
      if (audio.playState === 'Playing') {
        audioRef.current?.pause()
        audio.pause()
      } else {
        audioRef.current?.play()
        audio.play()
      }
      updateAudioInfo()
    }
  }

  useEffect(() => {
    if (!audio) return
    audioRef.current?.play()
    audio.play()
    updateAudioInfo()

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
            if (offset != null)
              audio.seek((curr, d) => Math.min(d, curr + offset))
            else audio.seek((curr, d) => Math.min(d, curr + 3))
          },
        },
        {
          action: 'seekbackward',
          handler: (evt) => {
            console.debug('backward', evt.seekOffset)
            const offset = evt.seekOffset
            // FIXME: Offset is not working, evt.seekOffset is always undefined
            if (offset != null) audio.seek((curr) => Math.max(0, curr - offset))
            else audio.seek((curr) => Math.max(0, curr - 3))
          },
        },
        {
          action: 'seekto',
          handler: (evt) => {
            // seekTime only work on mobile but not work on desktop
            console.debug('seekto event', evt)
            const time = evt.seekTime
            if (time != null) audio.seek(() => Math.max(0, Math.floor(time)))
          },
        },
      ]
      for (const { action, handler } of actions) {
        navigator.mediaSession.setActionHandler(action, handler)
      }
    }

    const ac = new AbortController()
    audio.target.addEventListener('tick', () => updateAudioInfo(), {
      signal: ac.signal,
    })
    audio.target.addEventListener(
      'ended',
      () => {
        nextAudio().then((haveNext) => {
          if (!haveNext) audioRef.current?.pause()
        })
      },
      {
        signal: ac.signal,
      },
    )
    return () => {
      ac.abort()
      audio.stop()
    }
    // FIXME: Not putting nextAudio as a dependency to prevent unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio])

  return (
    <div className="z-40 w-full rounded-t bg-white shadow-white dark:bg-gray-700">
      {audio && (
        <div className="flex w-full flex-row items-center justify-start p-1">
          <div>
            <Button
              variant="primary"
              className="m-0 h-full w-full p-5"
              onClick={() => playToggle()}
            >
              {audio?.playState !== 'Playing' ? <Play /> : <Pause />}
            </Button>
          </div>
          <div className="mx-2 flex flex-grow flex-col">
            <div>{playlist[curIndex].title}</div>
            <div>
              <input
                type="range"
                className="w-full"
                value={isSliding ? pgVal : Math.floor(audioInfo.currentTime)}
                min={0}
                max={Math.floor(audioInfo.duration)}
                onMouseDown={onSlideStart}
                onMouseUp={onSlideEnd}
                onTouchStart={onSlideStart}
                onTouchEnd={onSlideEnd}
                onChange={(e) => {
                  if (isSliding) setPgVal(parseInt(e.target.value))
                }}
              />
            </div>
            <div className="flex justify-center">
              {new SecCon(audioInfo.currentTime).format('M:S')} /{' '}
              {new SecCon(audioInfo.duration).format('M:S')} (
              {new SecCon(audioInfo.buffered).format('M:S')})
            </div>
          </div>
        </div>
      )}
      <audio className="w-0" ref={audioRef} src="/silence.mp3" loop />
    </div>
  )
}
