"use client";

import { useContext } from "react";
import { AudioPlayerContext } from "../libs/audio-player";

export const AudioPlayer = () => {
  const { ref, src } = useContext(AudioPlayerContext);

  return (
    <div>
      <div>Audio Player</div>
      <audio ref={ref} controls src={src} />
    </div>
  );
};
