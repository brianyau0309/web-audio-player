'use client'

import AudioCard from '$/components/AudioCard'
import { Input } from '$/components/Input'
import { DatabaseContext } from '$/database'
import { AudioInfo, fetchAudio, removeAudio } from '$/database/audio'
import { addAudioToPlaylist } from '$/database/playlist'
import { OPFSContext } from '$/opfs'
import { AudioPlayerContext } from '$/state/audio-player'
import cx from '$/utils/cx'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function PlaylistPage() {
  const db = use(DatabaseContext)
  const { dlDir } = use(OPFSContext)
  const [audioList, setAudioList] = useState<AudioInfo[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const {
    playlistDispatch,
    playlistState: { playlistId },
  } = use(AudioPlayerContext)

  useEffect(() => {
    if (!db) return
    fetchAudio(db, 100).then((res) => setAudioList(res))
  }, [db])

  const addToPlaylist = async (audio: AudioInfo) => {
    if (!db || !playlistId) {
      toast.error('Failed to add it to playlist')
      return
    }

    try {
      await addAudioToPlaylist(db, playlistId, audio.id)
      playlistDispatch({ type: 'addAudio', payload: [audio] })
      toast.success('Added to playlist')
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.match(/UNIQUE constraint failed/))
          toast.error('This audio is already in the playlist')
      } else {
        console.error(e)
        toast.error(String(e))
      }
    }
  }

  const handleDelete = async (index: number) => {
    if (!db || !dlDir || !audioList[index]) {
      toast.error('Failed to remove audio')
      return
    }
    await removeAudio(db, dlDir, audioList[index].id)
    playlistDispatch({ type: 'removeAudioById', payload: audioList[index].id })
    setAudioList((al) => al.filter((_, i) => i !== index))
    toast.success('Audio is removed')
  }

  return (
    <>
      <div className="sticky top-0 flex flex-row bg-black px-2 pt-4 md:px-0">
        <Input
          className="flex-grow"
          placeholder="Search"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {(searchQuery
          ? audioList.filter((a) => a.title.includes(searchQuery))
          : audioList
        ).map((audio, index) => (
          <AudioCard
            key={audio.id}
            className={cx('border-gray-200 dark:border-gray-700 md:border-t')}
            audio={audio}
            onClick={() => addToPlaylist(audio)}
            onDelete={() => handleDelete(index)}
          />
        ))}
      </ul>
    </>
  )
}
