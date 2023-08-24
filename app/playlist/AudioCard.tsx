import { Button } from '@/libs/components/Button'
import { ImageSkeleton } from '@/libs/components/ImageSkeleton'
import Trash from '@/libs/components/icons/Trash'
import cx from '@/libs/cx'
import { Provider } from '@/libs/state/opfs'
import { formHeaders } from '@/libs/utils/http'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const defaultImagePath = '/no-image-audio.png'

export type Audio = {
  id: string
  title: string
  artist?: string
  thumbnail?: string
  url: string
  provider: Provider
}

export type AudioCardProps = {
  className?: string
  audio: Audio
  provider?: Provider
  onClick?: () => void
  onDelete?: () => void
}

const AudioCard = ({ className, audio, onClick, onDelete }: AudioCardProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imgUrl, setImgUrl] = useState('')

  useEffect(() => {
    async function loadImage() {
      if (audio.thumbnail) {
        const res = await fetch(`${audio.provider.url}${audio.thumbnail}`, {
          headers: formHeaders(audio.provider.headers),
        })
        if (res.ok) {
          setImgUrl(URL.createObjectURL(await res.blob()))
        } else setImgUrl(defaultImagePath)
      } else setImgUrl(defaultImagePath)
    }
    try {
      loadImage()
    } finally {
      setIsLoading(false)
    }
  }, [audio])

  return (
    <li
      className={cx(
        'px-2 py-3 sm:py-4',
        onClick != null ? 'cursor-pointer hover:bg-slate-900' : '',
        className,
      )}
      role={onClick != null ? 'button' : undefined}
      onClick={() => onClick && onClick()}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {isLoading || !imgUrl ? (
            <ImageSkeleton className="h-20 w-20" />
          ) : (
            <Image
              className="h-20 w-20 rounded-xl bg-white"
              src={imgUrl}
              width={80}
              height={80}
              alt="audio thumbnail"
              priority
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
