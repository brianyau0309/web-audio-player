"use client";

import { Music } from "@/app/page";
import { createContext, useEffect, useState } from "react";

export type OPFSState = {
  rootDir?: FileSystemDirectoryHandle;
  dlDir?: FileSystemDirectoryHandle;
  playlistFile?: FileSystemFileHandle;
  playlist?: Playlist;
  addMusicToPlaylist?: (music: Music) => Promise<void>;
  removeMusicToPlaylist?: (music: Music) => Promise<void>;
};

export const OPFSContext = createContext<OPFSState>({});

export type Playlist = {
  downloaded: Music[];
};

export const OPFSProvider = ({ children }: { children: React.ReactNode }) => {
  const [rootDir, setRootDir] = useState<FileSystemDirectoryHandle>();
  const [dlDir, setDlDir] = useState<FileSystemDirectoryHandle>();
  const [playlistFile, setPlaylistFile] = useState<FileSystemFileHandle>();
  const [playlist, setPlaylist] = useState<Playlist>();

  useEffect(() => {
    (async () => {
      const rootHandle = await navigator.storage.getDirectory();
      setRootDir(rootHandle);
      const dlHandle = await rootHandle.getDirectoryHandle("downloaded", {
        create: true,
      });
      setDlDir(dlHandle);
      const playlistHandle = await rootHandle.getFileHandle("playlist.json", {
        create: true,
      });
      setPlaylistFile(playlistHandle);
      try {
        const playlist = await playlistHandle.getFile();
        const playlistText = await playlist.text();
        setPlaylist(JSON.parse(playlistText));
      } catch (e) {
        console.error(
          `Failed to parse playlist file, init a new one. error: `,
          e
        );
        setPlaylist({ downloaded: [] });
      }
    })();
  }, []);

  const addMusicToPlaylist = async (music: Music) => {
    const newPlaylist = {
      downloaded: [...(playlist?.downloaded ?? []), music],
    };
    setPlaylist(newPlaylist);
    const writable = await playlistFile?.createWritable();
    try {
      const playlistText = JSON.stringify(newPlaylist);
      await writable?.write(playlistText);
    } catch (e) {
      console.error("Failed to write playlist, error:", e);
    } finally {
      await writable?.close();
    }
  };

  const removeMusicToPlaylist = async (music: Music) => {
    const newPlaylist = {
      downloaded: (playlist?.downloaded ?? []).filter(
        (m) => m.musicId !== music.musicId
      ),
    };
    setPlaylist(newPlaylist);

    try {
      await dlDir?.removeEntry(`${music.musicId}.${music.codec.toLowerCase()}`);
    } catch (e) {
      console.error("Failed to remove file, error:", e);
    }

    const writable = await playlistFile?.createWritable();
    try {
      const playlistText = JSON.stringify(newPlaylist);
      await writable?.write(playlistText);
    } catch (e) {
      console.error("Failed to remove from playlist, error:", e);
    } finally {
      await writable?.close();
    }
  };

  return (
    <OPFSContext.Provider
      value={{
        rootDir,
        dlDir,
        playlistFile,
        playlist,
        addMusicToPlaylist,
        removeMusicToPlaylist,
      }}
    >
      {children}
    </OPFSContext.Provider>
  );
};
