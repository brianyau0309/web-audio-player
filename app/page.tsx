'use client'

import { Button } from '$/components/Button'
import { Input } from '$/components/Input'
import { DatabaseContext } from '$/database'
import { addAudio } from '$/database/audio'
import {
  AudioProvider,
  AudioProviders,
  fetchAudioProviders,
  findAudioProvider,
} from '$/database/audio-provider'
import { OPFSContext } from '$/opfs'
import { AudioPlayerContext } from '$/state/audio-player'
import { Music } from '$/state/audio-player/music'
import { formHeaders } from '$/utils/http'
import { use, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Search from './libs/components/icons/Search'
import Spinner from './libs/components/icons/Spinner'
import AudioCard from './playlist/AudioCard'

export default function Home() {
  const db = use(DatabaseContext)
  const { dlDir } = use(OPFSContext)
  const { setPlaylist } = use(AudioPlayerContext)
  const [providers, setProviders] = useState<AudioProviders>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResult, setSearchResult] = useState<Music[]>([])
  const [page, setPage] = useState<number>(1)
  const [providerId, setProviderId] = useState<string>()
  const [currentProvider, setCurrentProvider] = useState<AudioProvider | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // useEffect(() => {
  //   if ('serviceWorker' in navigator) {
  //     navigator.serviceWorker
  //       .register('./worker.js')
  //       .then((registration) => console.log('scope is: ', registration.scope))
  //   }
  // }, [])

  useEffect(() => {
    if (!db) return
    fetchAudioProviders(db, 100)
      .then((res) => setProviders(res))
      .catch((e) => {
        if (typeof e === 'object' && e != null && 'message' in e)
          console.warn(e?.message)
        else console.error(e)
      })
  }, [db])

  const search = async (page: number) => {
    if (!providerId || !db) {
      toast.error('Failed to search')
      return
    }
    const provider = await findAudioProvider(db, providerId)
    if (!provider) return
    setCurrentProvider(provider)

    const qs = new URLSearchParams({
      limit: String(10),
      skip: String(Math.max(page - 1, 0) * 10),
      ...(searchQuery ? { search: searchQuery } : undefined),
    })
    const res = await fetch(`${provider.url}?${qs.toString()}`, {
      headers: formHeaders(JSON.parse(provider.headers)),
    })
    if (res.ok) {
      const data = await res.json()
      return data
    }
    console.error(res.status, await res.json())
  }

  const downloadMusic = async (music: Music) => {
    if (!currentProvider || !dlDir || !db) {
      toast.error('Failed to download')
      return
    }
    setIsLoading(true)
    try {
      const newAudio = await addAudio(db, dlDir, {
        id: `${currentProvider.id}+${music.musicId}`,
        title: music.title,
        artist: music.artist,
        thumbnail: music.thumbnail,
        url: music.url,
        provider: {
          id: currentProvider.id,
          name: currentProvider.name,
          url: currentProvider.url,
          headers: JSON.parse(currentProvider.headers),
        },
      })
      setPlaylist((prev) => [...prev, newAudio])
      toast.success('Download success')
    } catch (e) {
      console.error(e)
      toast.error('Failed to add audio to playlist')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-50">
          <div role="status">
            <Spinner className="mr-2 inline h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600" />
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      <form
        className="mt-5 grid grid-cols-12 gap-3 px-2 md:p-0"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          search(page).then((res) => {
            if (res?.data) {
              setSearchResult(res.data)
            }
          })
        }}
      >
        <select
          className="col-span-12 block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-gray-400 dark:focus:border-blue-500 md:col-span-3"
          onChange={(e) => {
            setProviderId(e.currentTarget.value)
          }}
          required
        >
          <option value={0}>Select Provider</option>
          {providers?.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="col-span-10 mb-0 md:col-span-8"
          placeholder="Search Audio"
        />

        <Button
          className="col-span-2 mb-0 flex items-center justify-center px-1 md:col-span-1"
          variant="primary"
          type="submit"
        >
          <Search className="h-4 w-4 text-gray-800 dark:text-white" />
        </Button>
      </form>

      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {searchResult.map((music) => (
          <AudioCard
            key={music.musicId}
            className="border-gray-200 dark:border-gray-700 md:border-t"
            audio={{
              id: `${currentProvider?.id ?? ''}+{music.musicId}}`,
              title:
                music.title === 'untitled'
                  ? music.filename ?? 'untitled'
                  : music.title,
              artist: music.artist,
              url: music.url,
              thumbnail: music.thumbnail ?? undefined,
              provider: currentProvider ?? undefined,
            }}
            onClick={() => downloadMusic(music)}
          />
        ))}
      </ul>

      <div className="mt-4 flex w-full justify-between">
        <Button
          variant="primary"
          onClick={() => {
            const newPage = Math.max(page - 1, 1)
            setPage(newPage)
            search(newPage).then((res) => {
              if (res?.data) {
                setSearchResult(res.data)
              }
            })
          }}
        >
          Prev
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            const newPage = page + 1
            setPage(newPage)
            search(newPage).then((res) => {
              if (res?.data) {
                setSearchResult(res.data)
              }
            })
          }}
        >
          Next
        </Button>
      </div>
    </>
  )
}
