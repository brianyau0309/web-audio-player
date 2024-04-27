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
        <Toaster
          toastOptions={{
            style: {
              background: '#1E293B',
              filter:
                'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06))',
            },
            success: { style: { color: '#22C55E' } },
            error: { style: { color: '#DC2626' } },
          }}
        />
        <ServiceWorker />
        <AppStateProvider>
          <div className="flex flex-col" style={{ height: '100dvh' }}>
            <Navbar />

            <main className="container mx-auto flex-grow overflow-y-auto bg-black md:px-4">
              {children}
            </main>

            <AudioPlayer />
          </div>
        </AppStateProvider>
      </body>
    </html>
  )
}
