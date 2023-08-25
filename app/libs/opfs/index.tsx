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
}

export const OPFSContext = createContext<OPFSState>({ dlDir: null })

export const OPFSProvider = ({ children }: { children: React.ReactNode }) => {
  const [dlDir, setDlDir] = useState<FileSystemDirectoryHandle | null>(null)

  useEffect(() => {
    initOPFS()
  }, [])

  const initOPFS = async () => {
    const rootHandle = await navigator.storage.getDirectory()
    const dlHandle = await rootHandle.getDirectoryHandle('downloaded', {
      create: true,
    })
    setDlDir(dlHandle)
  }

  return (
    <OPFSContext.Provider value={{ dlDir }}>{children}</OPFSContext.Provider>
  )
}
