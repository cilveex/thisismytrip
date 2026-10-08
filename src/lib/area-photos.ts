/**
 * Photos for the "Why here" section. Files live in public/area/ (1600px wide WebP) with a
 * 600px thumbnail of the same name in public/area/thumb/. Add a line per photo, in display
 * order; the first is the cover.
 */
export interface AreaPhoto {
  /** File name without folder, e.g. "01-los-gigantes.webp" */
  file: string;
  /** Short alt text per language */
  alt: { lv: string; en: string };
}

export const AREA_PHOTOS: AreaPhoto[] = [];

export const areaFull = (p: AreaPhoto) => `/area/${p.file}`;
export const areaThumb = (p: AreaPhoto) => `/area/thumb/${p.file}`;
