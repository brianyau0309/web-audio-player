import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { AudioPlayer } from "./components/AudioPlayer";
import { AudioPlayerProvider } from "./libs/audio-player";
import { OPFSProvider } from "./libs/opfs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Audio Player",
  description: "Audio Player",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OPFSProvider>
          <AudioPlayerProvider>
            <nav>
              <ul className="flex justify-around items-center p-8">
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/downloaded">Downloaded</Link>
                </li>
              </ul>
            </nav>

            <AudioPlayer />

            {children}
          </AudioPlayerProvider>
        </OPFSProvider>
      </body>
    </html>
  );
}
