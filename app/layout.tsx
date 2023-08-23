import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AudioPlayer } from './libs/components/AudioPlayer'
import { AudioPlayerProvider } from './libs/audio-player'
import { OPFSProvider } from './libs/opfs'
import { Navbar } from './libs/components/Navbar/Navbar'
import { Toaster } from 'react-hot-toast'
import { DatabaseProvider } from './libs/db'
import { AudioProviderProvider } from './libs/db/audio-provider'
import { AudioProvider } from './libs/db/audio'

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
        <OPFSProvider>
          <DatabaseProvider>
            <AudioProviderProvider>
              <AudioProvider>
                <AudioPlayerProvider>
                  <Navbar />

                  <main className="container mx-auto h-screen md:px-4">
                    {children}
                    <div className="mt-10" />
                  </main>

                  <AudioPlayer />
                </AudioPlayerProvider>
              </AudioProvider>
            </AudioProviderProvider>
          </DatabaseProvider>
        </OPFSProvider>
      </body>
    </html>
  )
}
