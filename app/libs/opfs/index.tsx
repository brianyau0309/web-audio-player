'use client'

import { createContext, useEffect, useState } from 'react'
import { Music } from '../audio-player/music'
// import { SQLocal } from 'sqlocal'

export type OPFSState = {
  rootDir?: FileSystemDirectoryHandle
  dlDir?: FileSystemDirectoryHandle
  playlist?: Playlist
  providers?: Provider[]
  addMusicToPlaylist?: (music: Music) => Promise<void>
  removeMusicToPlaylist?: (music: Music) => Promise<void>
  addProvider?: (provider: Omit<Provider, 'uuid'>) => Promise<void>
  removeProvider?: (provider: Provider) => Promise<void>
}

export const OPFSContext = createContext<OPFSState>({})

export type Playlist = {
  downloaded: Music[]
}

export type Provider = {
  uuid: string
  name: string
  url: string
  headers: { name: string; value: string }[]
}

export const OPFSProvider = ({ children }: { children: React.ReactNode }) => {
  const [rootDir, setRootDir] = useState<FileSystemDirectoryHandle>()
  const [dlDir, setDlDir] = useState<FileSystemDirectoryHandle>()
  const [playlistFile, setPlaylistFile] = useState<FileSystemFileHandle>()
  const [playlist, setPlaylist] = useState<Playlist>()
  const [providersFile, setProvidersFile] = useState<FileSystemFileHandle>()
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    ;(async () => {
      // const { sql } = new SQLocal('database.sqlite3')
      // const data = await sql`SELECT * FROM groceries WHERE id > ${"1"}`
      // console.log(data)

      const rootHandle = await navigator.storage.getDirectory()
      setRootDir(rootHandle)

      const dlHandle = await rootHandle.getDirectoryHandle('downloaded', {
        create: true,
      })
      setDlDir(dlHandle)

      const playlistHandle = await rootHandle.getFileHandle('playlist.json', {
        create: true,
      })
      setPlaylistFile(playlistHandle)
      try {
        const playlist = await playlistHandle.getFile()
        const playlistText = await playlist.text()
        setPlaylist(JSON.parse(playlistText))
      } catch (e) {
        console.error(
          `Failed to parse playlist file, init a new one. error: `,
          e,
        )
        setPlaylist({ downloaded: [] })
      }

      const providersHandle = await rootHandle.getFileHandle('providers.json', {
        create: true,
      })
      setProvidersFile(providersHandle)
      try {
        const providers = await providersHandle.getFile()
        const providersText = await providers.text()
        setProviders(JSON.parse(providersText))
      } catch (e) {
        console.error(
          `Failed to parse providers file, init a new one. error: `,
          e,
        )
        setProviders([])
      }
    })()
  }, [])

  const addMusicToPlaylist = async (music: Music) => {
    const newPlaylist = {
      downloaded: [...(playlist?.downloaded ?? []), music],
    }
    setPlaylist(newPlaylist)
    const writable = await playlistFile?.createWritable()
    try {
      await writable?.truncate(0)
      await writable?.write(JSON.stringify(newPlaylist))
    } catch (e) {
      console.error('Failed to write playlist, error:', e)
    } finally {
      await writable?.close()
    }
  }

  const removeMusicToPlaylist = async (music: Music) => {
    const newPlaylist = {
      downloaded: (playlist?.downloaded ?? []).filter(
        (m) => m.musicId !== music.musicId,
      ),
    }
    setPlaylist(newPlaylist)

    try {
      await dlDir?.removeEntry(`${music.musicId}.${music.codec.toLowerCase()}`)
    } catch (e) {
      console.error('Failed to remove file, error:', e)
    }

    const writable = await playlistFile?.createWritable()
    try {
      await writable?.truncate(0)
      await writable?.write(JSON.stringify(newPlaylist))
    } catch (e) {
      console.error('Failed to remove from playlist, error:', e)
    } finally {
      await writable?.close()
    }
  }

  const addProvider = async (provider: Omit<Provider, 'uuid'>) => {
    const newProviders = [
      ...providers,
      { uuid: crypto.randomUUID(), ...provider },
    ]
    setProviders(newProviders)
    const writable = await providersFile?.createWritable()
    try {
      await writable?.truncate(0)
      await writable?.write(JSON.stringify(newProviders))
    } catch (e) {
      console.error('Failed to write provider, error:', e)
    } finally {
      await writable?.close()
    }
  }

  const removeProvider = async (provider: Provider) => {
    const newProviders = providers.filter((p) => p.uuid !== provider.uuid)
    setProviders(newProviders)
    const writable = await providersFile?.createWritable()
    try {
      await writable?.truncate(0)
      await writable?.write(JSON.stringify(newProviders))
    } catch (e) {
      console.error('Failed to remove from providers, error:', e)
    } finally {
      await writable?.close()
    }
  }

  return (
    <OPFSContext.Provider
      value={{
        rootDir,
        dlDir,
        playlist,
        addMusicToPlaylist,
        removeMusicToPlaylist,
        providers,
        addProvider,
        removeProvider,
      }}
    >
      {children}
    </OPFSContext.Provider>
  )
}
