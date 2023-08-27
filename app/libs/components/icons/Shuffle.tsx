import cx from '$/utils/cx'

export default function Shuffle(props: { className?: string }) {
  return (
    <svg
      className={cx('h-6 w-6 text-gray-800 dark:text-white', props.className)}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 20 18"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11.484 6.166 13 4h6m0 0-3-3m3 3-3 3M1 14h5l1.577-2.253M1 4h5l7 10h6m0 0-3 3m3-3-3-3"
      />
    </svg>
  )
}
