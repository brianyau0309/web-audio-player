'use client'

import { useContext } from 'react'
import { AudioPlayerContext } from '../audio-player'

export const AudioPlayer = () => {
  const { ref, src } = useContext(AudioPlayerContext)

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full">
      <audio className="h-full w-full" ref={ref} controls src={src} />
    </div>
  )
}
