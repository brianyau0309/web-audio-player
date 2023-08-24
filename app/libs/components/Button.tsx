import cx from '../cx'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary'
}

export const Button = ({
  children,
  className,
  variant,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cx(
        'focus:ring-3 mb-2 rounded-lg  px-5 py-2.5 text-sm font-medium ',
        variant === 'primary'
          ? 'bg-blue-700 text-white hover:bg-blue-800 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
          : '',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
