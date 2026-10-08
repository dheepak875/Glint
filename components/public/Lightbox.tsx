"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PublicPhoto } from "@/lib/albums/service";
import type { PhotoExif } from "@/lib/storage/exif";
import { ExifPanel } from "./ExifPanel";
import { LikeButton } from "./LikeButton";
import styles from "./Lightbox.module.css";

/**
 * The one deliberately animated moment in the app: opening a photo morphs it from its grid
 * position into the fullscreen view via a shared layoutId. Prev/next navigation inside the
 * lightbox is a quiet crossfade instead — repeating the grid-to-fullscreen morph on every
 * arrow press would turn the one bold interaction into background noise.
 */
export function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: PublicPhoto[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const photo = index !== null ? photos[index] : null;
  const [hasNavigated, setHasNavigated] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = index !== null;
    if (isOpen && !wasOpenRef.current) {
      setHasNavigated(false);
    }
    wasOpenRef.current = isOpen;
  }, [index]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    setHasNavigated(true);
    onNavigate((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null) return;
    setHasNavigated(true);
    onNavigate((index + 1) % photos.length);
  }, [index, photos.length, onNavigate]);

  useEffect(() => {
    if (index === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, onClose, goPrev, goNext]);

  useEffect(() => {
    if (index === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [index]);

  const useMorph = !reducedMotion && !hasNavigated;

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={photo.filename}
        >
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}

          <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
            <motion.img
              key={photo.id}
              layoutId={useMorph ? `photo-${photo.id}` : undefined}
              initial={useMorph ? undefined : { opacity: 0 }}
              animate={useMorph ? undefined : { opacity: 1 }}
              exit={useMorph ? undefined : { opacity: 0 }}
              transition={
                useMorph ? { type: "spring", bounce: 0.15, duration: 0.45 } : { duration: 0.15 }
              }
              src={`/api/media/${photo.mediumPath}`}
              alt=""
              className={styles.image}
            />
            <div className={styles.meta}>
              <div className={styles.metaHeader}>
                <p className={styles.filename}>{photo.filename}</p>
                <LikeButton key={photo.id} photoId={photo.id} />
              </div>
              <ExifPanel exif={photo.exifJson as PhotoExif | null} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
