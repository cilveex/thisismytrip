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

export const AREA_PHOTOS: AreaPhoto[] = [
  { file: "01-beach-palm.webp", alt: { lv: "Palma uz melnu smilšu pludmales", en: "Palm tree on a dark-sand beach" } },
  { file: "02-los-gigantes-cliffs.webp", alt: { lv: "Los Gigantes klintis pie okeāna", en: "The Los Gigantes cliffs rising from the ocean" } },
  { file: "03-colourful-lane.webp", alt: { lv: "Krāsainas mājas šaurā ielā ar okeānu galā", en: "A narrow lane of colourful houses with the ocean at the end" } },
  { file: "04-rock-pools.webp", alt: { lv: "Klinšu baseini pie okeāna", en: "Rocky ocean pools along the coast" } },
  { file: "05-cliffs-sky.webp", alt: { lv: "Los Gigantes klintis zem zilām debesīm", en: "Los Gigantes cliffs under a blue sky" } },
  { file: "06-playa-arena-sunset.webp", alt: { lv: "Pludmale starp priedēm un palmām", en: "Beach seen between pine and palm trees" } },
  { file: "07-beach-promenade.webp", alt: { lv: "Melnu smilšu pludmale un promenāde", en: "Black-sand beach and its promenade" } },
  { file: "08-old-town-street.webp", alt: { lv: "Krāsaina iela ar kafejnīcām", en: "A colourful street with cafés" } },
];

export const areaFull = (p: AreaPhoto) => `/area/${p.file}`;
export const areaThumb = (p: AreaPhoto) => `/area/thumb/${p.file}`;
