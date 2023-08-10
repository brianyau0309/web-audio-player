"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { OPFSContext } from "../libs/opfs";
import { Button } from "../libs/components/Button";

export default function DownloadPage() {
  const { dlDir } = useContext(OPFSContext);
  const [downloadList, setDownloadList] = useState<FileSystemFileHandle[]>([]);

  const loadDownloadedFile = useCallback(async () => {
    if (dlDir) {
      const files = [];
      for await (const file of dlDir?.values()) {
        if (file.kind === "directory") continue;
        files.push(file);
      }
      setDownloadList(files);
    }
  }, [dlDir]);

  useEffect(() => {
    loadDownloadedFile();
  }, [dlDir, loadDownloadedFile]);

  const removeFile = async (file: FileSystemFileHandle) => {
    dlDir?.removeEntry(file.name);
  };

  return (
    <>
      <h1 className="text-4xl font-bold">Download</h1>
      <ol>
        {downloadList.map((file, index) => (
          <li className="flex flex-row" key={file.name}>
            <div>
              {index + 1}. {file.name}
            </div>
            <Button onClick={() => removeFile(file)}>Remove File</Button>
          </li>
        ))}
      </ol>
    </>
  );
}
