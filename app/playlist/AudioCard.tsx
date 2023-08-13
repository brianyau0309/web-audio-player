import Image from 'next/image'
import { Button } from '../libs/components/Button'

export type Audio = {
  title: string
  artist?: string
  thumbnail?: string
}

export type AudioCardProps = {
  audio: Audio
  onClick?: () => void
  onDelete?: () => void
}

const AudioCard = ({ audio, onClick, onDelete }: AudioCardProps) => {
  return (
    <li className="py-3 sm:py-4">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Image
            className="h-24 w-24 rounded-xl"
            src={audio.thumbnail ?? '/no-image.png'}
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
          {onClick ? (
            <Button onClick={() => onClick()}>Set Music</Button>
          ) : null}
          {onDelete ? (
            <Button onClick={() => onDelete()}>Remove Music</Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export default AudioCard
