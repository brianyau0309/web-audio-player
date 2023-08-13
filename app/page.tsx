'use client'

import { useContext, useState } from 'react'
import { Music } from './libs/audio-player/music'
import { OPFSContext, Provider } from './libs/opfs'
import { Button } from './libs/components/Button'
import AudioCard from './playlist/AudioCard'

const formHeaders = (headers: Provider['headers']) =>
  headers.reduce((acc, cur) => {
    if (cur.name && cur.value) acc.append(cur.name, cur.value)
    return acc
  }, new Headers())

export default function Home() {
  const { dlDir, addMusicToPlaylist, providers } = useContext(OPFSContext)
  const [searchResult, setSearchResult] = useState<Music[]>([])
  const [page, setPage] = useState<number>(1)
  const [providerId, setProviderId] = useState<string>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const search = async (page: number) => {
    if (!providerId) return
    const provider = providers?.find((p) => p.uuid === providerId)
    if (!provider) return

    const qs = new URLSearchParams({
      limit: String(10),
      skip: String(Math.max(page - 1, 0) * 10),
    })
    const res = await fetch(`${provider.url}?${qs.toString()}`, {
      method: 'GET',
      headers: formHeaders(provider.headers),
    })
    if (res.ok) {
      const data = await res.json()
      return data
    }
    console.error(res.status, await res.json())
  }

  const downloadMusic = async (music: Music) => {
    if (!dlDir) return
    if (!providerId) return
    const provider = providers?.find((p) => p.uuid === providerId)
    if (!provider) return
    setIsLoading(true)
    try {
      const res = await fetch(`${provider.url}${music.url}`, {
        method: 'GET',
        headers: formHeaders(provider.headers),
      })
      const data = await res.blob()
      const fileHandle = await dlDir.getFileHandle(
        `${music.musicId}.${music.codec.toLowerCase()}`,
        {
          create: true,
        },
      )
      const writable = await fileHandle.createWritable()
      try {
        await writable.write(data)
        await addMusicToPlaylist?.(music)
      } finally {
        await writable.close()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-50">
          <div role="status">
            <svg
              aria-hidden="true"
              className="mr-2 inline h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-6 gap-3">
        <select
          className="col-span-4 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 md:col-span-5"
          onChange={(e) => {
            setProviderId(e.currentTarget.value)
          }}
        >
          <option value={0}>Select Provider</option>
          {providers?.map((provider) => (
            <option key={provider.uuid} value={provider.uuid}>
              {provider.name}
            </option>
          ))}
        </select>

        <Button
          className="col-span-2 mb-0 px-3 md:col-span-1"
          onClick={() => {
            setPage(1)
            search(page).then((res) => {
              if (res?.data) {
                setSearchResult(res.data)
              }
            })
          }}
        >
          Search
        </Button>
      </div>

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {searchResult.map((music) => (
          <AudioCard
            key={music.title}
            audio={{
              title: music.title,
              artist: music.artist,
              thumbnail: music.covers?.[0].data
                ? `data:image/jpeg;base64,${music.covers?.[0].data}`
                : undefined,
            }}
            onClick={() => downloadMusic(music)}
          />
        ))}
      </ul>

      <div className="mt-10 flex w-full justify-between">
        <Button
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
