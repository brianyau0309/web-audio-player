'use client'

import { useRouter } from 'next/navigation'

type NavButtonProps = {
  label?: string
  svg?: React.ReactElement
  href: string
}

export const NavButton = ({ label, svg, href }: NavButtonProps) => {
  const router = useRouter()
  const handleClick = () => {
    router.push(href)
  }

  return (
    <button
      className="group inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={handleClick}
    >
      {svg}
      <span className="text-xs text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-500">
        {label}
      </span>
    </button>
  )
}
