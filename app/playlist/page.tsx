'use client'

import { DatabaseContext } from '$/database'
import { removeAudio } from '$/database/audio'
import { OPFSContext } from '$/opfs'
import { AudioPlayerContext } from '$/state/audio-player'
import cx from '$/utils/cx'
import { use, useState } from 'react'
import toast from 'react-hot-toast'
import AudioCard from './AudioCard'
import { Button } from '$/components/Button'
import Shuffle from '$/components/icons/Shuffle'
import { Input } from '$/components/Input'

export default function PlaylistPage() {
  const db = use(DatabaseContext)
  const { dlDir } = use(OPFSContext)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const {
    playlistState: { curIndex, playlist },
    playlistDispatch,
    nextAudio,
  } = use(AudioPlayerContext)

  const handleDelete = async (index: number) => {
    if (!db || !dlDir || !playlist[index]) {
      toast.error('Failed to remove audio')
      return
    }
    await removeAudio(db, dlDir, playlist[index].id)
    playlistDispatch({ type: 'removeAudio', payload: index })
  }

  return (
    <>
      <div className="flex flex-row px-2 md:p-0">
        <Input
          className="flex-grow"
          placeholder="Search"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={() => playlistDispatch({ type: 'randomize' })}>
          <Shuffle />
        </Button>
      </div>
      <ul className="pt-4">
        {(searchQuery
          ? playlist.filter((a) => a.title.includes(searchQuery))
          : playlist
        ).map((audio, index) => (
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
