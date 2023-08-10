"use client";

import { useContext } from "react";
import { AudioPlayerContext } from "../libs/audio-player";
import { Music } from "../libs/audio-player/music";
import { OPFSContext } from "../libs/opfs";
import { Button } from "../libs/components/Button";

export default function PlaylistPage() {
  const { dlDir, playlist, removeMusicToPlaylist } = useContext(OPFSContext);
  const { setAudioSrc } = useContext(AudioPlayerContext);

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

  return (
    <>
      <h1 className="text-4xl font-bold">Playlist</h1>
      <ol>
        {playlist?.downloaded.map((music) => (
          <li className="flex flex-row" key={music.title}>
            <div>{music.title}</div>
            <Button onClick={() => setMusic(music)}>Set Music</Button>
            <Button onClick={() => removeMusic(music)}>Remove Music</Button>
          </li>
        ))}
      </ol>
    </>
  );
}
