import { useId, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useTrip } from "@/lib/trip-store";
import { MAX_PHOTOS, type Apartment } from "@/lib/trip-data";
import { deletePhotos, imageLoads, uploadPhoto } from "@/lib/photos";
import { cn } from "@/lib/cn";
import { Button } from "./ui";

/** Up to MAX_PHOTOS photos for a place: upload (drop or pick) or paste a link, reorder, remove. The first is the cover. */
export function PhotosField({ apt }: { apt: Apartment }) {
  const { update } = useTrip();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [link, setLink] = useState("");
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const photos = apt.photos;
  const room = MAX_PHOTOS - photos.length - pending;

  /** Append a photo to the live state. Returns false if the place is gone or already full. */
  const add = (url: string) => {
    let ok = false;
    update((s) => {
      const a = s.apartments.find((x) => x.id === apt.id);
      if (!a || a.photos.length >= MAX_PHOTOS || a.photos.includes(url)) return;
      a.photos.push(url);
      ok = true;
    });
    return ok;
  };

  const set = (next: string[]) =>
    update((s) => {
      const a = s.apartments.find((x) => x.id === apt.id);
      if (a) a.photos = next;
    });

  const upload = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!images.length) return setMsg({ kind: "err", text: "Those aren't image files." });
    const take = images.slice(0, Math.max(0, room));
    const skipped = images.length - take.length;
    if (!take.length) return setMsg({ kind: "err", text: `${MAX_PHOTOS} photos is the limit. Remove one first.` });
    setMsg(null);
    setPending((n) => n + take.length);
    let failed = 0;
    await Promise.all(
      take.map(async (f) => {
        try {
          const url = await uploadPhoto(apt.id, f);
          if (!add(url)) void deletePhotos([url]); // place deleted or filled meanwhile
        } catch (e) {
          console.error("[photos] upload failed", e);
          failed++;
        } finally {
          setPending((n) => n - 1);
        }
      }),
    );
    const done = take.length - failed;
    const parts = [
      done && `Added ${done} photo${done > 1 ? "s" : ""}.`,
      failed && `${failed} couldn't be uploaded — check the connection and try again.`,
      skipped && `${skipped} skipped: ${MAX_PHOTOS} photos is the limit.`,
    ].filter(Boolean);
    setMsg({ kind: failed || skipped ? "err" : "ok", text: parts.join(" ") });
  };

  const addLink = async (e?: FormEvent) => {
    e?.preventDefault();
    const url = link.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) return setMsg({ kind: "err", text: "Paste a full image link starting with https://." });
    if (room <= 0) return setMsg({ kind: "err", text: `${MAX_PHOTOS} photos is the limit. Remove one first.` });
    setPending((n) => n + 1);
    const ok = await imageLoads(url);
    setPending((n) => n - 1);
    if (!ok) return setMsg({ kind: "err", text: "That link didn't load as an image. Right-click the photo → “Copy image address”." });
    if (add(url)) {
      setLink("");
      setMsg({ kind: "ok", text: "Photo added." });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = [...e.dataTransfer.files];
    if (files.length) return void upload(files);
    // An image dragged from another browser tab arrives as a link
    const url = e.dataTransfer.getData("text/uri-list").split("\n")[0]?.trim();
    if (url) setLink(url);
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...photos];
    [next[i], next[i + d]] = [next[i + d]!, next[i]!];
    set(next);
  };

  const remove = (i: number) => {
    const url = photos[i]!;
    set(photos.filter((_, j) => j !== i));
    void deletePhotos([url]);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-muted">
        Photos ({photos.length} of {MAX_PHOTOS}) · the first one is the cover
      </p>

      {(photos.length > 0 || pending > 0) && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((url, i) => (
            <li key={url} className="overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-[4/3] bg-soft">
                <img src={url} alt={`Photo ${i + 1}`} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-xs font-extrabold text-on-accent">
                    Cover
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <IconBtn label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </IconBtn>
                <IconBtn label={`Remove photo ${i + 1}`} onClick={() => remove(i)} className="hover:text-bad">
                  <Trash2 className="h-5 w-5" aria-hidden />
                </IconBtn>
                <IconBtn label={`Move photo ${i + 1} later`} disabled={i === photos.length - 1} onClick={() => move(i, 1)}>
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </IconBtn>
              </div>
            </li>
          ))}
          {Array.from({ length: pending }, (_, i) => (
            <li key={`p${i}`} className="grid aspect-[4/3] place-items-center rounded-xl border bg-soft">
              <LoaderCircle className="h-6 w-6 animate-spin text-muted" aria-hidden />
              <span className="sr-only">Uploading…</span>
            </li>
          ))}
        </ul>
      )}

      {room > 0 && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center text-sm",
              over ? "border-primary bg-primary/10" : "border-line",
            )}
          >
            <ImagePlus className="h-6 w-6 text-muted" aria-hidden />
            <span className="hidden text-muted md:inline">Drop photos here, or</span>
            <Button variant="secondary" className="bg-card" onClick={() => fileRef.current?.click()}>
              Choose photos
            </Button>
            <input
              ref={fileRef}
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                void upload([...(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
          </div>
          <form onSubmit={addLink} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${inputId}-url`} className="mb-1 block text-sm font-bold text-muted">
                Or paste an image link
              </label>
              <input
                id={`${inputId}-url`}
                type="url"
                inputMode="url"
                className="field"
                value={link}
                placeholder="https://…jpg"
                onChange={(e) => {
                  setLink(e.target.value);
                  setMsg(null);
                }}
              />
            </div>
            <Button type="submit" variant="secondary" className="bg-card" disabled={!link.trim()}>
              Add
            </Button>
          </form>
        </>
      )}

      <p role="status" className={cn("min-h-5 text-sm font-bold", msg?.kind === "err" ? "text-bad" : "text-good")}>
        {msg?.text}
      </p>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("grid h-11 w-11 place-items-center text-muted hover:bg-soft disabled:opacity-30", className)}
    >
      {children}
    </button>
  );
}
