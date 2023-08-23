import Image from 'next/image'
import { Button } from '../libs/components/Button'
import { cx } from '../libs/cx'
import Trash from '../libs/icons/Trash'
import { useEffect, useState } from 'react'
import { Provider } from '../libs/opfs'

export type Audio = {
  id: string
  title: string
  artist?: string
  thumbnail?: string
  provider: Provider
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

const ImageSkeleton = (props: {
  className?: string
  iconClassName?: string
}) => (
  <div
    className={cx(
      'flex animate-pulse items-center justify-center rounded bg-gray-300 dark:bg-gray-700',
      props.className,
    )}
  >
    <svg
      className={cx(
        'h-10 w-10 text-gray-200 dark:text-gray-600',
        props.iconClassName,
      )}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 20 18"
    >
      <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
    </svg>
  </div>
)

const AudioCard = ({ className, audio, onClick, onDelete }: AudioCardProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imgUrl, setImgUrl] = useState('')

  useEffect(() => {
    async function loadImage() {
      if (audio.thumbnail && audio.provider?.headers && audio.provider?.url) {
        const res = await fetch(`${audio.provider.url}${audio.thumbnail}`, {
          headers: formHeaders(audio.provider.headers),
        })
        if (res.ok) {
          setImgUrl(URL.createObjectURL(await res.blob()))
        } else {
          setImgUrl('/no-image-audio.png')
        }
      } else {
        setImgUrl('/no-image-audio.png')
      }
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
          {isLoading || !imgUrl ? (
            <ImageSkeleton className="h-24 w-24" />
          ) : (
            <Image
              className="h-24 w-24 rounded-xl bg-white"
              src={imgUrl}
              width={100}
              height={100}
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
