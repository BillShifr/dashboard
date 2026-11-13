/**
 * Disp catalog — machine-usable extracts from «Югра — редактор.html».
 *
 * Glyphs: HTML embeds `const glyphs` (148 keys). `src/domain/_legacy/glyphs.js` has
 * 146 keys; the shared 146 entries are identical. HTML adds two extras: "?" and "<".
 * Use `_legacy/glyphs.js` unless those two characters are required.
 */

export { GROUPS, type Group } from "./groups";
export { INSTITUTIONS, type Institution } from "./institutions";
export { FACILITY_POSITIONS } from "./facilityPositions";
export {
  SLOTS,
  HEX_R,
  HEX_GAP,
  TILE_ORIGIN,
  CITY_HEX_R,
  ANCHORS,
  CITY_ANCHORS,
  type Slot,
  type Anchor,
} from "./layout";
export { REGIONS, type Region } from "./regions";
