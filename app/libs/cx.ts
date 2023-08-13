import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

export const cx = (...inputs: ClassValue[]) => twMerge(clsx(...inputs))
