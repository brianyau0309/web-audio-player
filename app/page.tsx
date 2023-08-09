"use client";

import { useContext, useEffect, useState } from "react";
import { OPFSContext } from "./libs/opfs";

export type Music = {
  musicId: string;
  path: string;
  filename: string;
  ext: string;
  title: string;
  artist?: string;
  album?: string;
  covers?: {
    type: string;
    format: string;
    data: string;
  }[];
  container: string;
  codec: string;
  lossless?: boolean;
  numberOfChannels?: number;
  bitsPerSample?: number;
  sampleRate?: number;
  duration?: number;
  bitrate?: number;
  url: string;
};

export default function Home() {
  const { dlDir, addMusicToPlaylist } = useContext(OPFSContext);
  const [searchResult, setSearchResult] = useState<Music[]>([]);
  const [page, setPage] = useState<number>(1);
  const [audioAPI, setAudioAPI] = useState<string>("");
  const [audioAPIHeaders, setAudioAPIHeaders] = useState<
    { header: string; value: string }[]
  >([]);

  const search = async (page: number) => {
    const qs = new URLSearchParams({
      limit: String(5),
      skip: String(Math.max(page - 1, 0) * 5),
    });
    const res = await fetch(`${audioAPI}?${qs.toString()}`, {
      method: "GET",
      headers: audioAPIHeaders.reduce<Headers>((acc, cur) => {
        if (cur.header && cur.value) acc.append(cur.header, cur.value);
        return acc;
      }, new Headers()),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    console.error(res.status, await res.json());
  };

  const downloadMusic = async (music: Music) => {
    if (!dlDir) return;
    const res = await fetch(`${audioAPI}${music.url}`, {
      method: "GET",
      headers: audioAPIHeaders.reduce<Headers>((acc, cur) => {
        if (cur.header && cur.value) acc.append(cur.header, cur.value);
        return acc;
      }, new Headers()),
    });
    const data = await res.blob();
    const fileHandle = await dlDir.getFileHandle(
      `${music.musicId}.${music.codec.toLowerCase()}`,
      {
        create: true,
      }
    );
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(data);
      await addMusicToPlaylist?.(music);
    } finally {
      await writable.close();
    }
  };

  return (
    <main>
      <h1 className="text-4xl font-bold">Home</h1>

      <input
        className="text-slate-800"
        value={audioAPI}
        onChange={(e) => setAudioAPI(e.target.value)}
      />
      <button
        onClick={() => {
          setPage(1);
          search(page).then((res) => {
            if (res?.data) {
              setSearchResult(res.data);
            }
          });
        }}
      >
        Search
      </button>

      <div className="flex flex-col">
        {audioAPIHeaders.map(({ header, value }, index) => (
          <div key={index} className="flex flex-row">
            <input
              className="text-slate-800"
              value={header}
              onChange={(e) => {
                const clone = JSON.parse(JSON.stringify(audioAPIHeaders));
                clone[index].header = e.target.value;
                setAudioAPIHeaders(clone);
              }}
            />
            <input
              className="text-slate-800"
              value={value}
              onChange={(e) => {
                const clone = JSON.parse(JSON.stringify(audioAPIHeaders));
                clone[index].value = e.target.value;
                setAudioAPIHeaders(clone);
              }}
            />
          </div>
        ))}
        <button
          onClick={() =>
            setAudioAPIHeaders((current) => {
              return [...current, { header: "", value: "" }];
            })
          }
        >
          +
        </button>
      </div>

      <ul>
        {searchResult.map((music) => (
          <li className="flex flex-row" key={music.musicId}>
            <div>{music.title}</div>
            <button onClick={() => downloadMusic(music)}>Download</button>
          </li>
        ))}
      </ul>

      <div className="flex justify-between w-full">
        <button
          onClick={() => {
            const newPage = Math.max(page - 1, 1);
            setPage(newPage);
            search(newPage).then((res) => {
              if (res?.data) {
                setSearchResult(res.data);
              }
            });
          }}
        >
          Prev
        </button>
        <button
          onClick={() => {
            const newPage = page + 1;
            setPage(newPage);
            search(newPage).then((res) => {
              if (res?.data) {
                setSearchResult(res.data);
              }
            });
          }}
        >
          Next
        </button>
      </div>
    </main>
  );
}
