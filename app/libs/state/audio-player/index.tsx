'use client'

import { DatabaseContext } from '$/database'
import { AudioInfo, fetchAudio } from '$/database/audio'
import { OPFSContext } from '$/opfs'
import { createContext, use, useEffect, useRef, useState } from 'react'

export type AudioPlayerState = {
  ref?: React.RefObject<HTMLAudioElement>
  src: string
  currentIndex: number
  setCurrentIndex: (index: number) => void
  nextAudio: () => boolean
  playlist: AudioInfo[]
  setPlaylist: React.Dispatch<React.SetStateAction<AudioInfo[]>>
}

export const AudioPlayerContext = createContext<AudioPlayerState>({
  src: '',
  currentIndex: -1,
  setCurrentIndex: async () => {},
  nextAudio: () => false,
  playlist: [],
  setPlaylist: () => {},
})

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const db = use(DatabaseContext)
  const { dlDir } = use(OPFSContext)
  const [playlist, setPlaylist] = useState<AudioInfo[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [currentAudio, setCurrentAudio] = useState<AudioInfo | null>(null)
  const ref = useRef<React.ElementRef<'audio'>>(null)
  const [src, setSrc] = useState<string>('')

  // Initialize Playlist
  useEffect(() => {
    if (!db) return
    fetchAudio(db, 100)
      .then((res) => setPlaylist(res))
      .catch((e) => {
        if (typeof e === 'object' && e != null && 'message' in e)
          console.warn(e?.message)
        else console.error(e)
      })
  }, [db, setPlaylist])

  // Load Audio
  useEffect(() => {
    const update = async () => {
      if (!dlDir || !currentAudio) return
      try {
        const file = await dlDir.getFileHandle(`${currentAudio.id}`)
        const url = URL.createObjectURL(await file.getFile())
        setSrc((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      } catch (e) {
        console.error(`Failed to get file handle for ${currentAudio.id}.`)
      }
    }
    update()
  }, [dlDir, currentAudio, setSrc])

  // Handle on audio change
  useEffect(() => {
    if (!playlist.length) return
    if (currentIndex < 0) return
    if (playlist[currentIndex].id === currentAudio?.id) return
    setCurrentAudio(playlist[currentIndex])
  }, [currentIndex, currentAudio, playlist, setCurrentAudio])

  const nextAudio = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= playlist.length) return false
    setCurrentIndex(nextIndex)
    return true
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        ref,
        src,
        currentIndex,
        setCurrentIndex,
        nextAudio,
        playlist,
        setPlaylist,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}
