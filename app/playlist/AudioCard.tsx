import Image from 'next/image'
import { Button } from '../libs/components/Button'
import { cx } from '../libs/cx'
import Trash from '../libs/icons/Trash'

export type Audio = {
  title: string
  artist?: string
  thumbnail?: string
}

export type AudioCardProps = {
  className?: string,
  audio: Audio
  onClick?: () => void
  onDelete?: () => void
}

const AudioCard = ({ className, audio, onClick, onDelete }: AudioCardProps) => {
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
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Image
            className="h-24 w-24 rounded-xl bg-white"
            src={audio.thumbnail ?? '/no-image-audio.png'}
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
              className="flex p-2 h-8 w-8 items-center justify-center rounded-full bg-transparent text-red-500 hover:text-red-700"
              onClick={() => onDelete()}
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
