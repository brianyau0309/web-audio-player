"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { AudioPlayerContext } from "../libs/audio-player";
import { OPFSContext } from "../libs/opfs";
import { Music } from "../page";

export default function DownloadedPage() {
  const { dlDir, playlist, removeMusicToPlaylist } = useContext(OPFSContext);
  const { setAudioSrc } = useContext(AudioPlayerContext);
  const [downloadedList, setDownloadedList] = useState<FileSystemFileHandle[]>(
    []
  );

  const loadDownloadedFile = useCallback(async () => {
    if (dlDir) {
      const files = [];
      for await (const file of dlDir?.values()) {
        if (file.kind === "directory") continue;
        files.push(file);
      }
      setDownloadedList(files);
    }
  }, [dlDir]);

  useEffect(() => {
    loadDownloadedFile();
  }, [dlDir, loadDownloadedFile, playlist]);

  const setMusic = async (music: Music) => {
    if (dlDir) {
      try {
        const file = await dlDir?.getFileHandle(
          `${music.musicId}.${music.codec.toLowerCase()}`
        );
        const url = URL.createObjectURL(await file.getFile());
        setAudioSrc(url);
      } catch (e) {
        console.error(
          `Failed to get file handle for ${
            music.musicId
          }.${music.codec.toLowerCase()}`
        );
      }
    }
  };

  const removeMusic = async (music: Music) => {
    if (removeMusicToPlaylist) removeMusicToPlaylist(music);
  };

  const removeFile = async (file: FileSystemFileHandle) => {
    dlDir?.removeEntry(file.name);
  };

  return (
    <main>
      <h1 className="text-4xl font-bold">Downloaded</h1>
      <ol>
        {playlist?.downloaded.map((music) => (
          <li className="flex flex-row" key={music.title}>
            <div>{music.title}</div>
            <button onClick={() => setMusic(music)}>Set Music</button>
            <button onClick={() => removeMusic(music)}>Remove Music</button>
          </li>
        ))}
      </ol>
      <ol>
        {downloadedList.map((file, index) => (
          <li className="flex flex-row" key={file.name}>
            <div>
              {index + 1}. {file.name}
            </div>
            <button onClick={() => removeFile(file)}>Remove File</button>
          </li>
        ))}
      </ol>
    </main>
  );
}
