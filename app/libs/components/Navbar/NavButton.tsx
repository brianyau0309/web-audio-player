'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cx } from '../../cx'

type NavButtonProps = {
  label?: string
  svg?: React.ReactElement
  href: string
}

export const NavButton = ({ label, svg, href }: NavButtonProps) => {
  const router = useRouter()
  const active = usePathname() === href
  const handleClick = () => {
    router.push(href)
  }

  return (
    <button
      className={cx(
        'inline-flex flex-col items-center justify-center px-5 ',
        active
          ? 'bg-gray-50 text-blue-600 dark:bg-gray-800 dark:text-blue-500'
          : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800',
      )}
      onClick={handleClick}
    >
      {svg}
      <span className={cx('text-xs')}>{label}</span>
    </button>
  )
}
