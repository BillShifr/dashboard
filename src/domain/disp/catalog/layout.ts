/** Static hex-layout inputs from disp HTML («Югра — редактор.html»). */

export const SLOTS = [
  [2, -1],
  [0, 0],
  [1, 2],
  [3, 1],
  [8, -3],
  [1, 0],
  [0, 1],
  [4, -1],
  [3, 0],
  [2, 1],
  [4, -2],
  [5, -2],
  [6, -2],
  [4, 0],
  [7, -2],
  [1, 1],
  [6, -3],
  [4, 1],
  [7, -3],
  [5, -1],
  [0, 3],
  [0, 2],
] as const;

/** Hex tile radius (const R in HTML). */
export const HEX_R = 29 as const;

/** Gap between hex tiles (const gap in HTML). */
export const HEX_GAP = 4 as const;

/** Pixel origin for slot→tile mapping: x = OX + 1.5 * step * q, y = OY + √3 * step * (r + q/2). */
export const TILE_ORIGIN = [62, 70] as const;

/** City marker hex radius used when building geo for city groups (i >= 9). */
export const CITY_HEX_R = 5.4 as const;

/** District geo anchors — index aligned with district groups g0..g8. */
export const ANCHORS = [
  [169, 103],
  [58, 104],
  [126, 249],
  [235, 232],
  [386, 186],
  [130, 150],
  [78, 181],
  [259, 163],
  [181, 193],
] as const;

/** City geo anchors — index aligned with city groups g9..g21 (cityAnchors[i - 9]). */
export const CITY_ANCHORS = [
  [185, 210],
  [288, 134],
  [307, 179],
  [328, 205],
  [238, 221],
  [374, 201],
  [121, 174],
  [324, 151],
  [249, 262],
  [348, 169],
  [269, 197],
  [101, 240],
  [79, 209],
] as const;

export type Slot = (typeof SLOTS)[number];
export type Anchor = (typeof ANCHORS)[number];
