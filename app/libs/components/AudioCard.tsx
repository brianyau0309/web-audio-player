import { Button } from '$/components/Button'
import { ImageSkeleton } from '$/components/ImageSkeleton'
import Trash from '$/components/icons/Trash'
import cx from '$/utils/cx'
import { AudioInfo } from '$/database/audio'
import { formHeaders } from '$/utils/http'
import Image from 'next/image'
import { use, useEffect, useState } from 'react'
import { OPFSContext } from '$/opfs'
import { parseBlob } from 'music-metadata-browser'

const defaultThumbnail = '/no-image-audio.png'

export async function loadImageFromFile(
  audioDir: FileSystemDirectoryHandle,
  fileName: string,
  thumailDir?: FileSystemDirectoryHandle,
) {
  if (thumailDir) {
    try {
      const fileHandle = await thumailDir.getFileHandle(fileName)
      const file = await fileHandle.getFile()
      return URL.createObjectURL(file)
    } catch {
      // ignore error and try to load from audio file
    }
  }

  try {
    const fileHandle = await audioDir.getFileHandle(fileName)
    const metaData = await parseBlob(await fileHandle.getFile())
    const firstPic = metaData.common.picture?.[0]
    if (!firstPic) return defaultThumbnail
    if (thumailDir) {
      const fileHandle = await thumailDir.getFileHandle(fileName, {
        create: true,
      })
      let imgFile
      try {
        imgFile = await fileHandle.createWritable()
        imgFile.truncate(0)
        await imgFile.write(firstPic.data)
      } finally {
        await imgFile?.close()
      }
    }
    return `data:${
      firstPic.format
    };charset=utf-8;base64,${firstPic.data.toString('base64')}`
  } catch (e) {
    console.error(e)
    return defaultThumbnail
  }
}

async function loadImageFromUrl(url: string, headers: string) {
  const res = await fetch(url, {
    headers: formHeaders(JSON.parse(headers)),
  })
  if (res.ok) return URL.createObjectURL(await res.blob())
  return defaultThumbnail
}

export type AudioCardInfo = Omit<AudioInfo, 'provider'> &
  Partial<Pick<AudioInfo, 'provider'>>

export type AudioCardProps = {
  className?: string
  audio: AudioCardInfo
  onClick?: () => void
  onDelete?: () => void
}

const AudioCard = ({ className, audio, onClick, onDelete }: AudioCardProps) => {
  const { dlDir, thumbnailDir } = use(OPFSContext)
  const [url, setUrl] = useState<string>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (audio.downloaded && dlDir && thumbnailDir) {
      setIsLoading(true)
      loadImageFromFile(dlDir, audio.id, thumbnailDir)
        .then((url) => setUrl(url))
        .catch(() => setUrl(defaultThumbnail))
        .finally(() => setIsLoading(false))
    } else if (
      !audio.thumbnail ||
      !audio.provider?.url ||
      !audio.provider?.headers
    ) {
      return setUrl(defaultThumbnail)
    } else {
      setIsLoading(true)
      loadImageFromUrl(
        `${audio.provider.url}${audio.thumbnail}`,
        audio.provider.headers,
      )
        .then((url) => setUrl(url))
        .finally(() => setIsLoading(false))
    }
  }, [
    dlDir,
    thumbnailDir,
    audio.id,
    audio.downloaded,
    audio.thumbnail,
    audio.provider?.url,
    audio.provider?.headers,
  ])

  return (
    <li
      className={cx(
        'px-2 py-3 sm:py-5',
        onClick != null ? 'cursor-pointer hover:bg-slate-900' : '',
        className,
      )}
      role={onClick != null ? 'button' : undefined}
      onClick={() => onClick && onClick()}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {isLoading || !url ? (
            <ImageSkeleton className="h-20 w-20 md:h-24 md:w-24" />
          ) : (
            <Image
              className="h-20 w-20 rounded-xl bg-white md:h-24 md:w-24"
              src={url}
              width={80}
              height={80}
              alt="audio thumbnail"
              placeholder="blur"
              blurDataURL={defaultThumbnail}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {audio.title}
          </p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {audio.artist ?? 'Unknown'}
          </p>
        </div>
        <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
          {onDelete ? (
            <Button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent p-2 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash />
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export default AudioCard
