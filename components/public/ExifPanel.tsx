import type { PhotoExif } from "@/lib/storage/exif";
import styles from "./ExifPanel.module.css";

const LABELS: Record<keyof PhotoExif, string> = {
  camera: "Camera",
  lens: "Lens",
  aperture: "Aperture",
  shutterSpeed: "Shutter",
  iso: "ISO",
  focalLength: "Focal length",
};

export function ExifPanel({ exif }: { exif: PhotoExif | null }) {
  if (!exif) return null;
  const entries = (Object.keys(LABELS) as (keyof PhotoExif)[])
    .map((key) => [LABELS[key], exif[key]] as const)
    .filter(([, value]) => value !== undefined && value !== null);

  if (entries.length === 0) return null;

  return (
    <dl className={styles.exif}>
      {entries.map(([label, value]) => (
        <div key={label} className={styles.row}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
