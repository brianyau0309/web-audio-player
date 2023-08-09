"use client";

import { ElementRef, RefObject, createContext, useRef, useState } from "react";

export type AudioPlayerState = {
  ref?: RefObject<HTMLAudioElement>;
  src: string;
  setAudioSrc: (url: string) => Promise<void>;
};

export const AudioPlayerContext = createContext<AudioPlayerState>({
  src: "",
  setAudioSrc: async () => {},
});

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const ref = useRef<ElementRef<"audio">>(null);
  const [src, setSrc] = useState<string>("");

  const setAudioSrc = async (url: string) => {
    if (src) URL.revokeObjectURL(src);
    setSrc(url);
  };
  return (
    <AudioPlayerContext.Provider value={{ ref, src, setAudioSrc }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};
