'use client'

import { useContext } from 'react'
import { AudioPlayerContext } from '../audio-player'

export const AudioPlayer = () => {
  const { ref, src, nextAudio } = useContext(AudioPlayerContext)

  return (
    <div className="fixed bottom-0 left-0 z-40 flex w-full">
      <audio
        className="h-full min-h-[2rem] w-full"
        ref={ref}
        controls
        src={src}
        onEnded={() => nextAudio()}
        autoPlay
      />
    </div>
  )
}
