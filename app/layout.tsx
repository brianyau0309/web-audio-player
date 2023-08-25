import AppStateProvider from '$/state'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { AudioPlayer } from './libs/components/AudioPlayer'
import { Navbar } from './libs/components/Navbar/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Audio Player',
  description: 'Audio Player',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        <AppStateProvider>
          <Navbar />

          <main className="container mx-auto h-[calc(100vh-2.5rem)] py-4 md:px-4">
            {children}
            <div className="mt-10" />
          </main>

          <AudioPlayer />
        </AppStateProvider>
      </body>
    </html>
  )
}
