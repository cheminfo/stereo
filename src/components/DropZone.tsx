import { useCallback, useRef, useState } from 'react';

import type { RawLogFile } from '../lib/parseLogs.ts';

interface DropZoneProps {
  onFiles: (files: RawLogFile[]) => void;
}

/**
 * A drag-and-drop (and click-to-browse) target that reads the dropped log files
 * as text and hands them to `onFiles`.
 * @param props - The component props.
 * @returns The drop-zone element.
 */
export function DropZone({ onFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = useCallback(
    async (fileList: FileList) => {
      const files = await Promise.all(
        [...fileList].map(async (file) => ({
          name: file.name,
          content: await file.text(),
        })),
      );
      onFiles(files);
    },
    [onFiles],
  );

  return (
    <div
      className={dragging ? 'dropzone dropzone--active' : 'dropzone'}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void readFiles(event.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".log,.out,.txt"
        hidden
        onChange={(event) => {
          if (event.target.files) void readFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <p className="dropzone__title">
        Drag &amp; drop Gaussian <code>.log</code> files here, or click to
        browse
      </p>
      <p className="dropzone__hint">
        File names must start with the stereoisomer number — files sharing a
        number are treated as conformers (e.g.{' '}
        <code>1_elaeocarpine_c1.log</code>
        ).
      </p>
    </div>
  );
}
