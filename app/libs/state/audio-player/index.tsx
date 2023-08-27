'use client'

import { DatabaseContext } from '$/database'
import { AudioInfo, fetchAudio } from '$/database/audio'
import { OPFSContext } from '$/opfs'
import { shuffle } from '$/utils/array'
import { createContext, use, useEffect, useReducer, useRef } from 'react'
import { toast } from 'react-hot-toast'

type PlaylistState = {
  playlist: AudioInfo[]
  curIndex: number
  src: string
}

type PlayListAction =
  | { type: 'setPlaylist'; payload: AudioInfo[] }
  | { type: 'addAudio'; payload: AudioInfo[] }
  | { type: 'removeAudio'; payload: number }
  | { type: 'setAudio'; payload: Pick<PlaylistState, 'curIndex' | 'src'> }
  | { type: 'randomize' }

const initialPlaylistState: PlaylistState = {
  playlist: [],
  curIndex: -1,
  src: '',
}

export type AudioPlayerState = {
  ref?: React.RefObject<HTMLAudioElement>
  playlistState: PlaylistState
  playlistDispatch: React.Dispatch<PlayListAction>
  nextAudio: (index?: number) => Promise<boolean>
}

export const AudioPlayerContext = createContext<AudioPlayerState>({
  playlistState: initialPlaylistState,
  playlistDispatch: () => {},
  nextAudio: () => Promise.resolve(false),
})

const reducer = (state: PlaylistState, action: PlayListAction) => {
  switch (action.type) {
    case 'setPlaylist':
      return { ...state, playlist: action.payload }
    case 'setAudio':
      return { ...state, ...action.payload }
    case 'addAudio':
      return { ...state, playlist: [...state.playlist, ...action.payload] }
    case 'removeAudio':
      const newPlaylist = state.playlist.filter((_, i) => i !== action.payload)
      if (action.payload !== state.curIndex) {
        const newIndex =
          state.curIndex > action.payload ? state.curIndex - 1 : state.curIndex
        return { ...state, playlist: newPlaylist, curIndex: newIndex }
      } else {
        return { ...state, playlist: newPlaylist, curIndex: -1, src: '' }
      }
    case 'randomize':
      const clone = state.playlist.slice()
      const curAudio =
        state.curIndex >= 0 ? clone.splice(state.curIndex, 1) : []
      const curIndex = state.curIndex >= 0 ? 0 : state.curIndex
      return { ...state, playlist: [...curAudio, ...shuffle(clone)], curIndex }
    default:
      return state
  }
}

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const db = use(DatabaseContext)
  const { dlDir } = use(OPFSContext)
  const ref = useRef<React.ElementRef<'audio'>>(null)
  const [state, dispatch] = useReducer(reducer, initialPlaylistState)

  // Initialize Playlist
  useEffect(() => {
    if (!db) return
    fetchAudio(db, 100)
      .then((res) => dispatch({ type: 'setPlaylist', payload: res }))
      .catch((e) => {
        if (typeof e === 'object' && e != null && 'message' in e)
          console.warn(e?.message)
        else console.error(e)
      })
  }, [db, dispatch])

  const nextAudio = async (index?: number) => {
    if (!dlDir) return false

    const nextIndex = index ?? state.curIndex + 1
    const nextAudio = state.playlist[nextIndex]
    // If there is no next audio, return false
    if (!nextAudio) return false
    // If the next audio is the same as the current audio, return false
    if (state.playlist[state.curIndex]?.id === nextAudio.id) return false
    try {
      const file = await dlDir.getFileHandle(`${nextAudio.id}`)
      const url = URL.createObjectURL(await file.getFile())
      dispatch({ type: 'setAudio', payload: { curIndex: nextIndex, src: url } })
      return true
    } catch (e) {
      toast.error(`Failed to get file handle for ${nextAudio.id}.`)
      return false
    }
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        ref,
        playlistState: state,
        playlistDispatch: dispatch,
        nextAudio,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}
