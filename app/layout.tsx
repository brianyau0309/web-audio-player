import AppStateProvider from '$/state'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { AudioPlayer } from './libs/components/AudioPlayer'
import { Navbar } from './libs/components/Navbar/Navbar'
import { ServiceWorker } from '$/sw'

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
        <ServiceWorker />
        <AppStateProvider>
          <div className="flex flex-col overflow-hidden">
            <Navbar />

            <main className="container mx-auto h-[calc(100vh-2.5rem)] overflow-y-auto bg-black md:px-4">
              {children}
              <div className="mt-10" />
            </main>

            <AudioPlayer />
          </div>
        </AppStateProvider>
      </body>
    </html>
  )
}
