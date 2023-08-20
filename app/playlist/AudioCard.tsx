import Image from 'next/image'
import { Button } from '../libs/components/Button'
import { cx } from '../libs/cx'
import Trash from '../libs/icons/Trash'
import { useEffect, useState } from 'react'
import { Provider } from '../libs/opfs'

export type Audio = {
  title: string
  artist?: string
  thumbnail?: string
}

export type AudioCardProps = {
  className?: string
  audio: Audio
  provider?: Provider
  onClick?: () => void
  onDelete?: () => void
}

const formHeaders = (headers: Provider['headers']) =>
  headers.reduce((acc, cur) => {
    if (cur.name && cur.value) acc.append(cur.name, cur.value)
    return acc
  }, new Headers())

const AudioCard = ({
  className,
  audio,
  provider,
  onClick,
  onDelete,
}: AudioCardProps) => {
  const [imgUrl, setImgUrl] = useState('')

  useEffect(() => {
    async function loadImage() {
      if (audio.thumbnail && provider?.headers && provider?.url) {
        const res = await fetch(`${provider.url}${audio.thumbnail}`, {
          method: 'GET',
          headers: formHeaders(provider.headers),
        })
        if (res.ok) {
          setImgUrl(URL.createObjectURL(await res.blob()))
        }
      }
    }
    loadImage()
  }, [audio.thumbnail, provider?.headers, provider?.url])

  return (
    <li
      className={cx(
        'px-2 py-3 sm:py-4',
        onClick != null ? 'cursor-pointer hover:bg-slate-950' : '',
        className,
      )}
      onClick={() => {
        if (onClick) onClick()
      }}
      role={onClick != null ? 'button' : undefined}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Image
            className="h-24 w-24 rounded-xl bg-white"
            src={imgUrl || '/no-image-audio.png'}
            width={100}
            height={100}
            alt="thumbnail"
          />
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
