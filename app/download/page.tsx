'use client'

import { OPFSContext } from '$/opfs'
import { use, useCallback, useEffect, useState } from 'react'
import AudioCard from '../playlist/AudioCard'
import toast from 'react-hot-toast'

export default function DownloadPage() {
  const { dlDir } = use(OPFSContext)
  const [downloadList, setDownloadList] = useState<FileSystemFileHandle[]>([])

  const loadDownloadedFile = useCallback(async () => {
    if (!dlDir) return
    const files = []
    for await (const file of dlDir.values()) {
      if (file.kind === 'directory') continue
      files.push(file)
    }
    setDownloadList(files)
  }, [dlDir])

  useEffect(() => {
    loadDownloadedFile()
  }, [dlDir, loadDownloadedFile])

  const removeFile = async (file: FileSystemFileHandle) => {
    if (!dlDir) {
      toast.error('Failed to remove audio')
      return
    }
    await dlDir.removeEntry(file.name)
    loadDownloadedFile()
  }

  return (
    <>
      <ul className="pt-4 md:grid md:grid-cols-2 md:gap-2">
        {downloadList.map((file) => (
          <AudioCard
            className="border-gray-200 dark:border-gray-700 md:border-t"
            key={file.name}
            audio={{ id: file.name, title: file.name, url: '' }}
            onDelete={() => removeFile(file)}
          />
        ))}
      </ul>
    </>
  )
}
