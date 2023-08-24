'use client'

import { useCallback, useContext, useEffect, useState } from 'react'
import AudioCard from '../playlist/AudioCard'
import { OPFSContext } from '@/libs/state/opfs'

export default function DownloadPage() {
  const { dlDir } = useContext(OPFSContext)
  const [downloadList, setDownloadList] = useState<FileSystemFileHandle[]>([])

  const loadDownloadedFile = useCallback(async () => {
    if (dlDir) {
      const files = []
      for await (const file of dlDir?.values()) {
        if (file.kind === 'directory') continue
        files.push(file)
      }
      setDownloadList(files)
    }
  }, [dlDir])

  useEffect(() => {
    loadDownloadedFile()
  }, [dlDir, loadDownloadedFile])

  const removeFile = async (file: FileSystemFileHandle) => {
    await dlDir?.removeEntry(file.name)
    loadDownloadedFile()
  }

  return (
    <>
      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {downloadList.map((file) => (
          <AudioCard
            className="border-gray-200 dark:border-gray-700 md:border-t"
            key={file.name}
            audio={{
              id: file.name,
              title: file.name,
              url: '',
              provider: { id: '', name: '', url: '', headers: [] },
            }}
            onDelete={() => removeFile(file)}
          />
        ))}
      </ul>
    </>
  )
}
