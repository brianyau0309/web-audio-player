'use client'

import {
  ElementRef,
  RefObject,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { OPFSContext } from '../opfs'
import { AudioContext } from '../db/audio'
import { Audio } from '@/playlist/AudioCard'

export type AudioPlayerState = {
  ref?: RefObject<HTMLAudioElement>
  src: string
  currentIndex: number
  setCurrentIndex: (index: number) => void
  nextAudio: () => boolean
  playlist: Audio[]
  setPlaylist: React.Dispatch<React.SetStateAction<Audio[]>>
}

export const AudioPlayerContext = createContext<AudioPlayerState>({
  src: '',
  currentIndex: -1,
  setCurrentIndex: async () => { },
  nextAudio: () => false,
  playlist: [],
  setPlaylist: () => { },
})

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { dlDir } = useContext(OPFSContext)
  const { fetchAudio } = useContext(AudioContext)
  const [playlist, setPlaylist] = useState<Audio[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [currentAudio, setCurrentAudio] = useState<Audio | null>(null)
  const ref = useRef<ElementRef<'audio'>>(null)
  const [src, setSrc] = useState<string>('')

  // Initialize Playlist
  useEffect(() => {
    fetchAudio(100)
      .then((res) => {
        setPlaylist(res)
      })
      .catch((e) => {
        if (typeof e === 'object' && e != null && 'message' in e)
          console.warn(e?.message)
        else console.error(e)
      })
  }, [fetchAudio, setPlaylist])

  // Load Audio
  useEffect(() => {
    const update = async () => {
      if (dlDir && currentAudio) {
        try {
          const file = await dlDir?.getFileHandle(`${currentAudio.id}`)
          const url = URL.createObjectURL(await file.getFile())
          setSrc((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return url
          })
        } catch (e) {
          console.error(`Failed to get file handle for ${currentAudio.id}.`)
        }
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
