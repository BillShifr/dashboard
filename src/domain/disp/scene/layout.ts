import {
  ANCHORS,
  CITY_ANCHORS,
  CITY_HEX_R,
  GROUPS,
  HEX_GAP,
  HEX_R,
  INSTITUTIONS,
  REGIONS,
  SLOTS,
  TILE_ORIGIN,
  type Group,
  type Institution,
} from "@/domain/disp/catalog";
import { flatTopHex, polygonPath } from "@/domain/shared/geometry";

export type Tile = Group & {
  x: number;
  y: number;
  r: number;
  poly: [number, number][];
};

export type GeoFeature = Group & {
  x: number;
  y: number;
  d: string;
};

export type Cell = Institution & {
  x: number;
  y: number;
  poly: [number, number][];
  d: string;
};

const step = HEX_R + HEX_GAP / Math.sqrt(3);

export const TILES: Tile[] = GROUPS.map((g, i) => {
  const [q, r] = SLOTS[i]!;
  const x = TILE_ORIGIN[0] + 1.5 * step * q;
  const y = TILE_ORIGIN[1] + Math.sqrt(3) * step * (r + q / 2);
  return { ...g, x, y, r: HEX_R, poly: flatTopHex(x, y, HEX_R) };
});

export const GEO: GeoFeature[] = GROUPS.map((g, i) => ({
  ...g,
  x: i < 9 ? ANCHORS[i]![0] : CITY_ANCHORS[i - 9]![0],
  y: i < 9 ? ANCHORS[i]![1] : CITY_ANCHORS[i - 9]![1],
  d:
    i < 9
      ? REGIONS[i]!.d
      : polygonPath(
          flatTopHex(
            CITY_ANCHORS[i - 9]![0],
            CITY_ANCHORS[i - 9]![1],
            CITY_HEX_R,
          ),
        ),
}));

function clip(
  poly: [number, number][],
  nx: number,
  ny: number,
  c: number,
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const da = a[0] * nx + a[1] * ny - c;
    const db = b[0] * nx + b[1] * ny - c;
    if (da <= 1e-8) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

function centroid(poly: [number, number][]): [number, number] {
  let cross = 0;
  let x = 0;
  let y = 0;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length]!;
    const v = p[0] * q[1] - q[0] * p[1];
    cross += v;
    x += (p[0] + q[0]) * v;
    y += (p[1] + q[1]) * v;
  });
  return [x / (3 * cross), y / (3 * cross)];
}

export const CELLS: Cell[] = TILES.flatMap((t) => {
  const group = INSTITUTIONS.filter((f) => f.group === t.id);
  const candidates: [number, number][] = [];
  for (let row = -8; row <= 8; row++) {
    for (let col = -8; col <= 8; col++) {
      const x = col + (row % 2) / 2;
      const y = (row * Math.sqrt(3)) / 2;
      candidates.push([x, y]);
    }
  }
  candidates.sort(
    (a, b) =>
      a[0] ** 2 + a[1] ** 2 - b[0] ** 2 - b[1] ** 2 ||
      a[1] - b[1] ||
      a[0] - b[0],
  );
  const chosen = candidates.slice(0, group.length);
  const radius = Math.max(1, ...chosen.map((p) => Math.hypot(...p)));
  const seeds = chosen.map(
    (p) =>
      [
        t.x + (p[0] * t.r * 0.78) / radius,
        t.y + (p[1] * t.r * 0.78) / radius,
      ] as [number, number],
  );
  return group.map((f, i) => {
    let poly = t.poly;
    const p = seeds[i]!;
    seeds.forEach((q, j) => {
      if (j !== i) {
        poly = clip(
          poly,
          q[0] - p[0],
          q[1] - p[1],
          (q[0] ** 2 + q[1] ** 2 - p[0] ** 2 - p[1] ** 2) / 2,
        );
      }
    });
    const [x, y] = centroid(poly);
    return { ...f, x, y, poly, d: polygonPath(poly) };
  });
});
