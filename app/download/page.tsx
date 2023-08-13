'use client'

import { useCallback, useContext, useEffect, useState } from 'react'
import { OPFSContext } from '../libs/opfs'
import { Button } from '../libs/components/Button'
import Trash from '../libs/icons/Trash'
import AudioCard from '../playlist/AudioCard'

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
      <h1 className="text-4xl font-bold">Download</h1>
      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {downloadList.map((file, index) => (
          <AudioCard
            className="md:border-t border-gray-200 dark:border-gray-700"
            key={file.name}
            audio={{
              title: file.name,
            }}
            onDelete={() => removeFile(file)}
          />
        ))}
      </ul>
    </>
  )
}
