'use client'

import { Button } from '@/libs/components/Button'
import { Input } from '@/libs/components/Input'
import { AudioPlayerContext } from '@/libs/state/audio-player'
import { Music } from '@/libs/state/audio-player/music'
import { DB } from '@/libs/state/db'
import { AudioContext } from '@/libs/state/db/audio'
import { AudioProviderContext } from '@/libs/state/db/audio-provider'
import { formHeaders } from '@/libs/utils/http'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import AudioCard from './playlist/AudioCard'
import Search from './libs/components/icons/Search'
import Spinner from './libs/components/icons/Spinner'

export default function Home() {
  const { addAudio } = useContext(AudioContext)
  const { setPlaylist } = useContext(AudioPlayerContext)
  const [providers, setProviders] = useState<
    Pick<DB['audio_provider'], 'id' | 'name'>[]
  >([])
  const { fetchAudioProviders, findAudioProvider } =
    useContext(AudioProviderContext)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResult, setSearchResult] = useState<Music[]>([])
  const [page, setPage] = useState<number>(1)
  const [providerId, setProviderId] = useState<string>()
  const [currentProvider, setCurrentProvider] = useState<
    DB['audio_provider'] | null
  >(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // useEffect(() => {
  //   if ('serviceWorker' in navigator) {
  //     navigator.serviceWorker
  //       .register('./worker.js')
  //       .then((registration) => console.log('scope is: ', registration.scope))
  //   }
  // }, [])

  useEffect(() => {
    fetchAudioProviders(100)
      .then((res) => {
        setProviders(res)
      })
      .catch((e) => {
        if (typeof e === 'object' && e != null && 'message' in e)
          console.warn(e?.message)
        else console.error(e)
      })
  }, [fetchAudioProviders])

  const search = async (page: number) => {
    if (!providerId) return
    const provider = await findAudioProvider(providerId)
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
    if (!currentProvider) return
    setIsLoading(true)
    try {
      const newAudio = await addAudio({
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
          className="col-span-12 block w-full appearance-none border-0 border-b-2 border-gray-200 bg-transparent px-0 py-2.5 text-sm text-gray-500 focus:border-gray-200 focus:outline-none focus:ring-0 dark:border-gray-700 dark:text-gray-400 md:col-span-3"
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
              id: `${currentProvider?.id ?? ''}-{music.musicId}}`,
              title:
                music.title === 'untitled'
                  ? music.filename ?? 'untitled'
                  : music.title,
              artist: music.artist,
              thumbnail: music.thumbnail ? music.thumbnail : undefined,
              url: music.url,
              provider: currentProvider
                ? {
                  id: currentProvider.id,
                  name: currentProvider.name,
                  url: currentProvider.url,
                  headers: JSON.parse(currentProvider.headers),
                }
                : { id: '', name: '', url: '', headers: [] },
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
