'use client'

import AudioCard from '$/components/AudioCard'
import { Button } from '$/components/Button'
import { Input } from '$/components/Input'
import { DatabaseContext } from '$/database'
import { AudioInfo, addAudio } from '$/database/audio'
import {
  AudioProvider,
  AudioProviders,
  fetchAudioProviders,
  findAudioProvider,
} from '$/database/audio-provider'
import { OPFSContext } from '$/opfs'
import { formHeaders } from '$/utils/http'
import { use, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Search from './libs/components/icons/Search'
import Spinner from './libs/components/icons/Spinner'

export default function Home() {
  const db = use(DatabaseContext)
  const { dlDir } = use(OPFSContext)
  const [providers, setProviders] = useState<AudioProviders>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResult, setSearchResult] = useState<AudioInfo[]>([])
  const [page, setPage] = useState<number>(1)
  const [providerId, setProviderId] = useState<string>()
  const [curProvider, setCurProvider] = useState<AudioProvider | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!db) return
    fetchAudioProviders(db, 100)
      .then((res) => setProviders(res))
      .catch((e) => console.warn(e?.message))
  }, [db])

  const search = async (page: number) => {
    if (!providerId || !db) {
      toast.error('Failed to search')
      return
    }
    const provider = await findAudioProvider(db, providerId)
    if (!provider) return
    setCurProvider(provider)

    const PAGE_SIZE = 10
    const qs = new URLSearchParams({
      limit: String(PAGE_SIZE),
      skip: String(Math.max(page - 1, 0) * PAGE_SIZE),
      ...(searchQuery ? { search: searchQuery } : undefined),
    })
    try {
      const res = await fetch(`${provider.url}?${qs.toString()}`, {
        headers: formHeaders(JSON.parse(provider.headers)),
      })
      if (res.ok) {
        const data = await res.json()
        return data
      }
      console.error(res.status, await res.json())
    } catch (e) {
      toast.error('Something wrong, please retry later.')
    }
  }

  const downloadMusic = async (audio: AudioInfo) => {
    if (!curProvider || !dlDir || !db) {
      toast.error('Failed to download')
      return
    }
    setIsLoading(true)
    try {
      await addAudio(db, dlDir, {
        id: `${curProvider.id}+${audio.id}`,
        title: audio.title,
        artist: audio.artist,
        thumbnail: audio.thumbnail,
        url: audio.url,
        downloaded: true,
        provider: {
          id: curProvider.id,
          name: curProvider.name,
          url: curProvider.url,
          headers: curProvider.headers,
        },
      })
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
        className="sticky top-0 grid grid-cols-12 gap-3 bg-black px-2 pt-4 md:px-0"
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

      <ul className="overflow-y-auto pt-4 md:grid md:grid-cols-2 md:gap-2">
        {searchResult.map((audio) => (
          <AudioCard
            key={audio.id}
            className="border-gray-200 dark:border-gray-700 md:border-t"
            audio={{
              id: `${curProvider?.id ?? ''}+${audio.id}}`,
              title: audio.title,
              artist: audio.artist,
              url: audio.url,
              thumbnail: audio.thumbnail ?? undefined,
              downloaded: false,
              provider: curProvider ?? undefined,
            }}
            onClick={() => downloadMusic(audio)}
          />
        ))}
      </ul>

      {searchResult.length > 0 && (
        <div className="mx-auto flex w-11/12 py-8 pt-2 md:w-1/2">
          <Button
            variant="primary"
            className="mx-auto w-full"
            onClick={() => {
              const newPage = page + 1
              setPage(newPage)
              search(newPage).then((res) => {
                if (res?.data) {
                  setSearchResult((prev) => [...prev, ...res.data])
                }
              })
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </>
  )
}
