'use client'

import { AudioInfo } from '$/database/audio'
import { OPFSContext } from '$/opfs'
import { Budio } from '$/budio'
import { shuffle } from '$/utils/array'
import {
  createContext,
  use,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-hot-toast'
import { loadImageFromFile } from '$/components/AudioCard'

type PlaylistState = {
  playlistId: string | null
  playlist: AudioInfo[]
  curIndex: number
  src: string
  audio: Budio | null
}

type PlayListAction =
  | { type: 'setPlaylistId'; payload: string }
  | { type: 'setPlaylist'; payload: AudioInfo[] }
  | { type: 'addAudio'; payload: AudioInfo[] }
  | { type: 'removeAudio'; payload: number }
  | { type: 'removeAudioById'; payload: string }
  | {
      type: 'setAudio'
      payload: Pick<PlaylistState, 'curIndex' | 'src' | 'audio'>
    }
  | { type: 'randomize' }

const initialPlaylistState: PlaylistState = {
  playlistId: null,
  playlist: [],
  curIndex: -1,
  src: '',
  audio: null,
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
  let playlist: AudioInfo[]
  switch (action.type) {
    case 'setPlaylistId':
      return { ...state, playlistId: action.payload }
    case 'setPlaylist':
      return { ...state, playlist: action.payload }
    case 'setAudio':
      state.audio = null
      return { ...state, ...action.payload }
    case 'addAudio':
      return { ...state, playlist: [...state.playlist, ...action.payload] }
    case 'removeAudio':
      playlist = state.playlist.filter((_, i) => i !== action.payload)
      if (action.payload !== state.curIndex) {
        const newIndex =
          state.curIndex > action.payload ? state.curIndex - 1 : state.curIndex
        return { ...state, playlist, curIndex: newIndex }
      } else {
        return { ...state, playlist, curIndex: -1, src: '' }
      }
    case 'removeAudioById':
      const idx = state.playlist.findIndex(({ id }) => id === action.payload)
      if (idx === -1) return state
      playlist = state.playlist.filter(({ id }) => id !== action.payload)
      if (idx !== state.curIndex) {
        const newIndex =
          state.curIndex > idx ? state.curIndex - 1 : state.curIndex
        return { ...state, playlist, curIndex: newIndex }
      } else {
        return { ...state, playlist, curIndex: -1, src: '' }
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
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null)
  const { dlDir, thumbnailDir } = use(OPFSContext)
  const ref = useRef<React.ElementRef<'audio'>>(null)
  const [state, dispatch] = useReducer(reducer, initialPlaylistState)

  useEffect(() => {
    setAudioCtx(new AudioContext())
  }, [setAudioCtx])

  const nextAudio = async (index?: number) => {
    if (!dlDir || !audioCtx) return false

    const nextIndex = index ?? state.curIndex + 1
    const nextAudio = state.playlist[nextIndex]
    // If there is no next audio, return false
    if (!nextAudio) return false
    // If the next audio is the same as the current audio, return false
    if (state.playlist[state.curIndex]?.id === nextAudio.id) return false
    try {
      const file = await dlDir.getFileHandle(`${nextAudio.id}`)
      const url = URL.createObjectURL(await file.getFile())
      let imgUrl
      if (nextAudio.downloaded && dlDir && thumbnailDir) {
        imgUrl = await loadImageFromFile(dlDir, nextAudio.id, thumbnailDir)
          .then((url) => url)
          .catch(() => null)
      }

      const artwork = imgUrl
        ? [
            {
              src: imgUrl,
              sizes: '512x512',
              type: 'image/png',
            },
          ]
        : []

      const a = new Budio(
        audioCtx,
        async () => (await file.getFile()).arrayBuffer(),
        {
          mediaMetadata: new MediaMetadata({
            title: nextAudio.title,
            artist: nextAudio.artist,
            artwork,
          }),
        },
      )
      dispatch({
        type: 'setAudio',
        payload: { curIndex: nextIndex, src: url, audio: a },
      })
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
