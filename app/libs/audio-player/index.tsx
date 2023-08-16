'use client'

import {
  ElementRef,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { OPFSContext } from '../opfs'

export type AudioPlayerState = {
  ref?: RefObject<HTMLAudioElement>
  src: string
  currentIndex: number
  setAudio: (index: number) => void
  nextAudio: () => boolean
}

export const AudioPlayerContext = createContext<AudioPlayerState>({
  src: '',
  currentIndex: -1,
  setAudio: async () => {},
  nextAudio: () => false,
})

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { dlDir, playlist } = useContext(OPFSContext)
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const ref = useRef<ElementRef<'audio'>>(null)
  const [src, setSrc] = useState<string>('')

  const setAudio = useCallback(
    async (index: number) => {
      if (dlDir && playlist && playlist?.downloaded && index >= 0) {
        const music = playlist.downloaded[index]
        try {
          const file = await dlDir?.getFileHandle(
            `${music.musicId}.${music.codec.toLowerCase()}`,
          )
          const url = URL.createObjectURL(await file.getFile())
          setSrc((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return url
          })
        } catch (e) {
          console.error(
            `Failed to get file handle for ${
              music.musicId
            }.${music.codec.toLowerCase()}`,
          )
        }
      }
    },
    [dlDir, playlist],
  )

  useEffect(() => {
    setAudio(currentIndex)
  }, [currentIndex, setAudio])

  const nextAudio = () => {
    if (!playlist?.downloaded) return false
    const nextIndex = currentIndex + 1
    if (nextIndex >= playlist.downloaded.length) return false
    setCurrentIndex(nextIndex)
    return true
  }

  return (
    <AudioPlayerContext.Provider
      value={{ ref, src, currentIndex, setAudio: setCurrentIndex, nextAudio }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}
