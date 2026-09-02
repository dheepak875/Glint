import exifr from "exifr";

export interface PhotoExif {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  focalLength?: string;
}

const PICK_TAGS = ["Make", "Model", "LensModel", "FNumber", "ExposureTime", "ISO", "FocalLength"];

/** Returns null when the file has no readable EXIF data (e.g. screenshots, stripped exports). */
export async function extractExif(buffer: Buffer): Promise<PhotoExif | null> {
  let raw: Record<string, unknown> | null;
  try {
    raw = await exifr.parse(buffer, { pick: PICK_TAGS });
  } catch {
    return null;
  }
  if (!raw) return null;

  const make = typeof raw.Make === "string" ? raw.Make.trim() : undefined;
  const model = typeof raw.Model === "string" ? raw.Model.trim() : undefined;
  const camera = [make, model].filter(Boolean).join(" ") || undefined;
  const lens = typeof raw.LensModel === "string" ? raw.LensModel : undefined;
  const aperture = typeof raw.FNumber === "number" ? `f/${trimNumber(raw.FNumber)}` : undefined;
  const shutterSpeed = formatShutterSpeed(raw.ExposureTime as number | undefined);
  const iso = typeof raw.ISO === "number" ? raw.ISO : undefined;
  const focalLength =
    typeof raw.FocalLength === "number" ? `${Math.round(raw.FocalLength)}mm` : undefined;

  const exif: PhotoExif = { camera, lens, aperture, shutterSpeed, iso, focalLength };
  const hasAnyValue = Object.values(exif).some((v) => v !== undefined);
  return hasAnyValue ? exif : null;
}

function trimNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatShutterSpeed(exposureTime?: number): string | undefined {
  if (!exposureTime || exposureTime <= 0) return undefined;
  if (exposureTime >= 1) return `${trimNumber(exposureTime)}s`;
  return `1/${Math.round(1 / exposureTime)}s`;
}
