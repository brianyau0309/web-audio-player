'use client'

import { createContext, useEffect, useState } from 'react'
import { Music } from '../audio-player/music'

export type OPFSState = {
  dlDir?: FileSystemDirectoryHandle
}

export const OPFSContext = createContext<OPFSState>({})

export type Playlist = {
  downloaded: Music[]
}

export type Provider = {
  id: string
  name: string
  url: string
  headers: { name: string; value: string }[]
}

export const OPFSProvider = ({ children }: { children: React.ReactNode }) => {
  const [dlDir, setDlDir] = useState<FileSystemDirectoryHandle>()

  useEffect(() => {
    ;(async () => {
      const rootHandle = await navigator.storage.getDirectory()
      const dlHandle = await rootHandle.getDirectoryHandle('downloaded', {
        create: true,
      })
      setDlDir(dlHandle)
    })()
  }, [])

  return (
    <OPFSContext.Provider value={{ dlDir }}>{children}</OPFSContext.Provider>
  )
}
