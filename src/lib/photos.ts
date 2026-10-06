import { supabase } from "./supabase";
import { uid } from "./trip-data";

/** Public Supabase Storage bucket; see supabase/migrations/003_place_photos.sql */
export const PHOTO_BUCKET = "place-photos";
const MAX_WIDTH = 1600;
const QUALITY = 0.8;

const toBlob = (c: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((res) => c.toBlob(res, type, QUALITY));

/**
 * Shrink a photo to at most MAX_WIDTH wide and re-encode it as WebP (JPEG where the browser
 * can't encode WebP, e.g. older Safari). Phone photos are rotated upright from their EXIF data.
 */
export async function compressImage(file: Blob): Promise<Blob> {
  const img = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_WIDTH / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  const webp = await toBlob(canvas, "image/webp");
  // Browsers that can't encode WebP quietly hand back a PNG instead
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg");
  if (!jpeg) throw new Error("Couldn't encode the image");
  return jpeg;
}

const asDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });

/** Compress and upload one photo for a place; returns its public URL. Without Supabase (local dev) it's a data URL. */
export async function uploadPhoto(placeId: string, file: File): Promise<string> {
  const blob = await compressImage(file);
  if (!supabase) return asDataUrl(blob);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${placeId}/${uid()}.${ext}`;
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  const { error } = await bucket.upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Storage path of one of our uploads, or null for a pasted link / data URL. */
export function storagePath(url: string): string | null {
  if (!supabase) return null;
  const base = supabase.storage.from(PHOTO_BUCKET).getPublicUrl("").data.publicUrl;
  return url.startsWith(base) ? decodeURIComponent(url.slice(base.length).split("?")[0]!) : null;
}

/** Remove uploaded photos from storage. Pasted links are left alone. Failures are only logged. */
export async function deletePhotos(urls: string[]) {
  const paths = urls.map(storagePath).filter((p): p is string => !!p);
  if (!supabase || !paths.length) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) console.error("[photos] delete failed", error);
}

/** Remove everything stored for a place, including leftovers from interrupted uploads. */
export async function deletePlacePhotos(placeId: string, urls: string[]) {
  if (!supabase) return;
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  const { data } = await bucket.list(placeId, { limit: 100 });
  const listed = (data ?? []).map((f) => `${placeId}/${f.name}`);
  const known = urls.map(storagePath).filter((p): p is string => !!p);
  const paths = [...new Set([...listed, ...known])];
  if (!paths.length) return;
  const { error } = await bucket.remove(paths);
  if (error) console.error("[photos] delete failed", error);
}

/** Resolves true if the URL loads as an image within a few seconds. */
export function imageLoads(url: string, ms = 8000) {
  return new Promise<boolean>((res) => {
    const img = new Image();
    const timer = setTimeout(() => res(false), ms);
    img.onload = () => {
      clearTimeout(timer);
      res(img.naturalWidth > 0);
    };
    img.onerror = () => {
      clearTimeout(timer);
      res(false);
    };
    img.referrerPolicy = "no-referrer";
    img.src = url;
  });
}
