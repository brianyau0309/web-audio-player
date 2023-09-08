'use client'

import { createContext, useEffect, useState } from 'react'

export class OPFSError extends Error {}

export class OPFSNotInitializedError extends OPFSError {
  constructor() {
    super('OPFSProvider not initialized')
  }
}

export type OPFSState = {
  dlDir: FileSystemDirectoryHandle | null
  thumbnailDir: FileSystemDirectoryHandle | null
}

export const OPFSContext = createContext<OPFSState>({
  dlDir: null,
  thumbnailDir: null,
})

export const OPFSProvider = ({ children }: { children: React.ReactNode }) => {
  const [dlDir, setDlDir] = useState<FileSystemDirectoryHandle | null>(null)
  const [thumbnailDir, setThumbnailDir] =
    useState<FileSystemDirectoryHandle | null>(null)

  useEffect(() => {
    initOPFS()
  }, [])

  const initOPFS = async () => {
    const rootHandle = await navigator.storage.getDirectory()
    const dlHandle = await rootHandle.getDirectoryHandle('downloaded', {
      create: true,
    })
    setDlDir(dlHandle)
    const thumbnailHandle = await rootHandle.getDirectoryHandle('thumbnail', {
      create: true,
    })
    setThumbnailDir(thumbnailHandle)
  }

  return (
    <OPFSContext.Provider value={{ dlDir, thumbnailDir }}>
      {children}
    </OPFSContext.Provider>
  )
}
