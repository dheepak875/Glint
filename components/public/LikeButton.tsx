"use client";

import { useEffect, useState } from "react";
import styles from "./LikeButton.module.css";

/** Caller should render with `key={photoId}` so switching photos remounts this with fresh state. */
export function LikeButton({ photoId }: { photoId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/photos/${photoId}/likes`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setLiked(Boolean(data.liked));
        setCount(data.count);
      });
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  async function handleClick() {
    if (pending || count === null) return;
    setPending(true);

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => (c ?? 0) + (nextLiked ? 1 : -1));

    const res = await fetch(`/api/photos/${photoId}/like`, { method: "POST" });
    setPending(false);

    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } else {
      setLiked(!nextLiked);
      setCount((c) => (c ?? 0) - (nextLiked ? 1 : -1));
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike photo" : "Like photo"}
      disabled={count === null}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 21s-6.7-4.35-9.3-8.1C.86 10.02 1.4 6.6 4.2 5.1c2.2-1.18 4.6-.4 5.8 1.4L12 8.6l2-2.1c1.2-1.8 3.6-2.58 5.8-1.4 2.8 1.5 3.34 4.92 1.5 7.8C18.7 16.65 12 21 12 21z"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <span className={styles.count}>{count ?? " "}</span>
    </button>
  );
}
