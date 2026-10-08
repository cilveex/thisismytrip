import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "./i18n";

/** "Our favourite", with a pink star */
export function FavBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full bg-soft px-3 py-0.5 text-base leading-snug font-extrabold", className)}>
      <Star className="h-4 w-4 shrink-0 fill-fav text-fav" aria-hidden />
      {t("fav.label")}
    </span>
  );
}
