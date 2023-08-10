import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AudioPlayer } from "./libs/components/AudioPlayer";
import { AudioPlayerProvider } from "./libs/audio-player";
import { OPFSProvider } from "./libs/opfs";
import { Navbar } from "./libs/components/Navbar/Navbar";

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
            <Navbar />

            <main className="h-screen container mx-auto">
              {children}
              <div className="mt-12" />
            </main>

            <AudioPlayer />
          </AudioPlayerProvider>
        </OPFSProvider>
      </body>
    </html>
  );
}
