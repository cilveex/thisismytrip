import { Star } from "lucide-react";
import type { Who } from "@/lib/trip-data";
import { cn } from "@/lib/cn";
import { useI18n } from "./i18n";
import { favKey } from "./stay-format";

/** "We're taking this one" (couple) / "Our recommendation" (family) */
export function FavBadge({ who, className }: { who: Who; className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-0.5 text-base leading-snug font-extrabold text-[#1d2428]",
        className,
      )}
    >
      <Star className="h-4 w-4 shrink-0 fill-current" aria-hidden />
      {t(favKey(who))}
    </span>
  );
}
