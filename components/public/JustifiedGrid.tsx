"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { PublicPhoto } from "@/lib/albums/service";
import styles from "./JustifiedGrid.module.css";

const TARGET_ROW_HEIGHT = 320;
const GAP = 8;
const MOBILE_BREAKPOINT = 640;

interface Row {
  photos: PublicPhoto[];
  height: number;
}

/** Classic justified-gallery packing: fills each row to the container width by scaling
 * a target row height, native aspect ratios preserved, no cropping. */
function computeRows(photos: PublicPhoto[], containerWidth: number): Row[] {
  const rows: Row[] = [];
  let current: PublicPhoto[] = [];
  let aspectSum = 0;

  for (const photo of photos) {
    const ratio = photo.width / photo.height;
    current.push(photo);
    aspectSum += ratio;

    const widthAtTarget = aspectSum * TARGET_ROW_HEIGHT + GAP * (current.length - 1);
    if (widthAtTarget >= containerWidth) {
      const scale = (containerWidth - GAP * (current.length - 1)) / (aspectSum * TARGET_ROW_HEIGHT);
      rows.push({ photos: current, height: TARGET_ROW_HEIGHT * scale });
      current = [];
      aspectSum = 0;
    }
  }
  if (current.length > 0) {
    // Last partial row: left-aligned at the target height rather than stretched to fill.
    rows.push({ photos: current, height: TARGET_ROW_HEIGHT });
  }
  return rows;
}

export function JustifiedGrid({
  photos,
  onOpen,
}: {
  photos: PublicPhoto[];
  onOpen: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (width === 0) {
    return <div ref={containerRef} className={styles.container} />;
  }

  if (width < MOBILE_BREAKPOINT) {
    return (
      <div ref={containerRef} className={styles.mobileStack}>
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            className={styles.mobileItem}
            onClick={() => onOpen(index)}
            aria-label={`Open ${photo.filename}`}
          >
            <motion.img
              layoutId={`photo-${photo.id}`}
              src={`/api/media/${photo.thumbnailPath}`}
              alt=""
              style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              className={styles.mobileImg}
            />
          </button>
        ))}
      </div>
    );
  }

  const rows = computeRows(photos, width);
  let runningIndex = 0;

  return (
    <div ref={containerRef} className={styles.container}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row} style={{ height: row.height }}>
          {row.photos.map((photo) => {
            const index = runningIndex++;
            const itemWidth = (photo.width / photo.height) * row.height;
            return (
              <button
                key={photo.id}
                className={styles.item}
                style={{ width: itemWidth, height: row.height }}
                onClick={() => onOpen(index)}
                aria-label={`Open ${photo.filename}`}
              >
                <motion.img
                  layoutId={`photo-${photo.id}`}
                  src={`/api/media/${photo.thumbnailPath}`}
                  alt=""
                  className={styles.img}
                />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
