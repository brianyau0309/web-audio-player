import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

const cx = (...inputs: ClassValue[]) => twMerge(clsx(...inputs))

export default cx
