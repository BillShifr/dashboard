/**
 * District SVG path `d` strings (9 regions).
 *
 * Byte-identical to disp HTML `const regions` and `src/domain/_legacy/regions.js`.
 * Shared geo module path: `src/domain/_legacy/regions.js`
 * (promote to `src/domain/geo/regions` when a shared geo package is introduced).
 */
export { regions as REGIONS } from "../../_legacy/regions.js";

export type Region = {
  id: number;
  d: string;
};
