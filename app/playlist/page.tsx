'use client'

import AudioCard from '$/components/AudioCard'
import { Button } from '$/components/Button'
import { Input } from '$/components/Input'
import { Modal } from '$/components/Modal'
import Add from '$/components/icons/Add'
import Shuffle from '$/components/icons/Shuffle'
import { DatabaseContext } from '$/database'
import {
  Playlist,
  createPlaylist,
  fetchPlaylists,
  findPlaylist,
  removeAudioFromPlaylist,
} from '$/database/playlist'
import { AudioPlayerContext } from '$/state/audio-player'
import cx from '$/utils/cx'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function PlaylistPage() {
  const db = use(DatabaseContext)
  const [show, setShow] = useState<boolean>(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [newPlaylist, setNewPlaylist] = useState<string>('')
  const {
    playlistState: { curIndex, playlist, playlistId },
    playlistDispatch,
    nextAudio,
  } = use(AudioPlayerContext)

  useEffect(() => {
    if (!db) return
    fetchPlaylists(db).then((res) => setPlaylists(res))
  }, [db])

  const handleDelete = async (index: number) => {
    if (!db || !playlistId || !playlist[index]) {
      toast.error('Failed to remove audio')
      return
    }
    await removeAudioFromPlaylist(db, playlistId, playlist[index].id)
    playlistDispatch({ type: 'removeAudio', payload: index })
  }

  return (
    <>
      <Modal
        title="Add Playlist"
        submitText="Add"
        show={show}
        close={() => setShow(false)}
        onSubmit={() => {
          if (!newPlaylist || !db) return
          setShow(false)
          createPlaylist(db, newPlaylist).then(() => {
            toast.success('Playlist is created')
            fetchPlaylists(db).then((res) => setPlaylists(res))
          })
        }}
      >
        <div className="flex flex-col">
          <Input
            value={newPlaylist}
            onChange={(e) => setNewPlaylist(e.target.value)}
            placeholder="Playlist Name"
          />
        </div>
      </Modal>

      <div className="sticky top-0 flex flex-row bg-black px-2 pt-4 md:px-0">
        <select
          className="col-span-12 block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-gray-400 dark:focus:border-blue-500 md:col-span-3"
          onChange={(e) => {
            if (!db) return

            playlistDispatch({
              type: 'setPlaylistId',
              payload: e.currentTarget.value,
            })
            findPlaylist(db, e.currentTarget.value)
              .then((res) =>
                playlistDispatch({
                  type: 'setPlaylist',
                  payload: res?.audios ?? [],
                }),
              )
              .catch((e) => {
                if (typeof e === 'object' && e != null && 'message' in e)
                  console.warn(e?.message)
                else console.error(e)
              })
          }}
          required
        >
          <option value={0}>Select Playlist</option>
          {playlists?.map((p) => (
            <option selected={p.id === playlistId} key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button className="p-2" onClick={() => setShow(true)}>
          <Add className="h-5 w-5 text-gray-800 dark:text-white" />
        </Button>
        <Button
          className="p-2"
          onClick={() => playlistDispatch({ type: 'randomize' })}
        >
          <Shuffle className="h-5 w-5 text-gray-800 dark:text-white" />
        </Button>
      </div>
      <ul className="pt-4">
        {playlist.map((audio, index) => (
          <AudioCard
            key={audio.id}
            className={cx('border-gray-200 dark:border-gray-700 md:border-t', {
              'bg-slate-900': index === curIndex,
            })}
            audio={audio}
            onClick={() => nextAudio(index)}
            onDelete={() => handleDelete(index)}
          />
        ))}
      </ul>
    </>
  )
}
