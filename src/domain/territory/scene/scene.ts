import {
  facilities,
  settlements,
} from "@/domain/territory/catalog/facilities.js";
import { hexLayout, polygonPath } from "@/domain/territory/catalog/geometry.js";
import {
  CENTERS,
  CITIES,
  CITY_LABEL_WIDTHS,
  DISTRICT_LINES,
  LABEL_WIDTHS,
  NAMES,
} from "@/domain/territory/catalog/meta";
import { regions } from "@/domain/territory/catalog/regions.js";
import {
  ABOVE_TARGET,
  MISSING,
  facilityColor,
  formattedValue,
  markerPath,
  markers,
  scales,
} from "@/domain/territory/medical/scales.js";
import type { TerritoryPayload } from "@/domain/presets/schema";
import { contrast } from "@/domain/shared/color";
import { rectPath } from "@/domain/shared/geometry";
import { glyphAdvanceWidth, textShape } from "@/domain/shared/text";
import type { Shape } from "@/domain/shared/types";

type HexBlock = {
  id: number;
  x: number;
  y: number;
  r: number;
  points: [number, number][];
};

type Region = { id: number; d: string };

type Facility = {
  id: string;
  index: number;
  name: string;
  city: string;
  area: number;
};

type Marker = Facility & {
  x: number;
  y: number;
  size?: number;
  poly?: [number, number][];
};

type ScaleKey = keyof typeof scales;

type TerritoryRecord = {
  value: number | null;
  manual: string | null;
};

const REGIONS = regions as Region[];
const HEX = hexLayout as HexBlock[];
const FACILITIES = facilities as Facility[];
const SETTLEMENTS = settlements as unknown as Record<
  string,
  { center: [number, number]; area: number }
>;
const MARKERS = markers as { geo: Marker[]; hex: Marker[] };
const colorOf = facilityColor as (
  record: TerritoryRecord,
  scale: string,
) => string;
const valueText = formattedValue as (value: number | null) => string;
const pathOf = markerPath as (m: Marker) => string;
const SCALES = scales as Record<ScaleKey, { name: string; colors: string[] }>;

function isMedical(state: TerritoryPayload): boolean {
  return state.mode === "med";
}

function baseMode(state: TerritoryPayload): "geo" | "hex" {
  return isMedical(state)
    ? state.medicalBase
    : state.mode === "hex"
      ? "hex"
      : "geo";
}

function geometry(
  state: TerritoryPayload,
  i: number,
): { d: string; center: readonly [number, number] } {
  const h = HEX[i]!;
  return baseMode(state) === "geo"
    ? { d: REGIONS[i]!.d, center: CENTERS[i]! }
    : { d: polygonPath(h.points), center: [h.x, h.y] };
}

function labels(state: TerritoryPayload, i: number, fill: string): Shape[] {
  const [x, y] = geometry(state, i).center;
  const width = baseMode(state) === "geo" ? LABEL_WIDTHS[i]! : HEX[i]!.r * 1.45;
  const ink = contrast(fill);
  const out: Shape[] = [];

  if (state.districts) {
    DISTRICT_LINES[i]!.forEach((line, j) =>
      out.push({
        ...textShape(
          line,
          x,
          y + (state.cities ? -9 : -2) + j * 9,
          8.5,
          width,
          ink,
        ),
        group: String(i),
      }),
    );
  } else {
    const text = valueText(state.items[i]!.value);
    out.push({
      ...textShape(text, x, y + (state.cities ? -3 : 6), 19, width, ink),
      group: String(i),
    });
  }

  if (state.cities) {
    const city = CITIES[i]!;
    const cityWidth =
      state.mode === "geo" ? Math.min(width, CITY_LABEL_WIDTHS[i]!) : width;
    out.push({
      ...textShape(
        city,
        x,
        y + (state.districts ? 15 : 13),
        7.5,
        cityWidth,
        ink,
      ),
      group: String(i),
    });
  }

  if (!state.districts && !state.cities) {
    out.push({
      ...textShape(String(i + 1), x, y - 14, 6, width, ink),
      group: String(i),
    });
  }

  if (state.districts) {
    const text = valueText(state.items[i]!.value);
    out.push({
      ...textShape(text, x, y - 23, 12, width, ink),
      group: String(i),
    });
  }

  return out;
}

function legendBands(state: TerritoryPayload, y = 309): Shape[] {
  const colors = SCALES[state.scale as ScaleKey].colors;
  const bands: Array<[string, string]> = [
    ["0–25", colors[0]!],
    ["25–50", colors[1]!],
    ["50–75", colors[2]!],
    ["75–100", colors[3]!],
    [">100", ABOVE_TARGET as string],
    ["Нет данных", MISSING as string],
  ];
  const out: Shape[] = [];
  bands.forEach(([label, fill], i) => {
    const x = 10 + i * 82;
    out.push({ d: rectPath(x, y, 10, 7), fill });
    out.push(textShape(label, x + 42, y + 6, 6, 60));
  });
  return out;
}

export type TerritoryScene = {
  shapes: Shape[];
  height: number;
};

/** Build vector shapes for geo / hex / medical territory modes (HTML `scene`). */
export function scene(
  state: TerritoryPayload,
  includeRoster = false,
): TerritoryScene {
  const shapes: Shape[] = [];
  const medical = isMedical(state);

  for (let i = 0; i < 9; i++) {
    const fill = medical ? "#EDF0F1" : colorOf(state.items[i]!, state.scale);
    shapes.push({
      d: geometry(state, i).d,
      fill,
      stroke: medical ? "#AFB8BA" : state.outline,
      width: medical ? 0.8 : 1.6,
      group: medical ? null : String(i),
    });
    if (!medical) shapes.push(...labels(state, i, fill));
  }

  let height = 340;

  if (medical) {
    const currentMarkers = MARKERS[state.medicalBase];
    if (state.medicalBase === "geo") {
      const occupied: [number, number, number, number][] = currentMarkers.map(
        (m) => [m.x - 7, m.y - 7, m.x + 7, m.y + 11],
      );
      for (const city of Object.keys(SETTLEMENTS)) {
        const group = currentMarkers.filter((m) => m.city === city);
        if (!group.length) continue;
        const cx = SETTLEMENTS[city]!.center[0];
        const cy = Math.min(...group.map((m) => m.y)) - 11;
        const width = Math.min(62, (glyphAdvanceWidth(city) * 5.2) / 1000);
        const candidates: { x: number; y: number; cost: number }[] = [];
        for (let dy = -48; dy <= 48; dy += 8) {
          for (let dx = -40; dx <= 40; dx += 10) {
            candidates.push({
              x: cx + dx,
              y: cy + dy,
              cost: dx * dx + dy * dy,
            });
          }
        }
        candidates.sort((a, b) => a.cost - b.cost);
        const spot = candidates.find((p) => {
          const r: [number, number, number, number] = [
            p.x - width / 2 - 1,
            p.y - 5,
            p.x + width / 2 + 1,
            p.y + 2,
          ];
          return (
            r[0] > 0 &&
            r[2] < 500 &&
            r[1] > 0 &&
            r[3] < 300 &&
            occupied.every(
              (q) => r[2] < q[0] || r[0] > q[2] || r[3] < q[1] || r[1] > q[3],
            )
          );
        }) || { x: cx, y: cy };
        occupied.push([
          spot.x - width / 2 - 1,
          spot.y - 5,
          spot.x + width / 2 + 1,
          spot.y + 2,
        ]);
        shapes.push(textShape(city, spot.x, spot.y, 5.2, 62, "#66777B"));
      }
    }

    for (const m of currentMarkers) {
      const record = (state.records[m.id] ?? {
        value: null,
        manual: null,
      }) as TerritoryRecord;
      const fill = colorOf(record, state.scale);
      const ink = contrast(fill);
      shapes.push({
        d: pathOf(m),
        fill,
        stroke: "#FFFFFF",
        width: 1,
        facility: m.id,
      });
      shapes.push({
        ...textShape(
          valueText(record.value),
          m.x,
          m.y + (m.size ? m.size * 0.1 : 1.7),
          m.size || 5.3,
          m.size ? m.size * 4 : 10,
          ink,
        ),
        facility: m.id,
      });
      shapes.push({
        ...textShape(
          String(m.index),
          m.x,
          m.y + (m.size ? m.size : 10),
          m.size ? Math.max(3.3, m.size * 0.45) : 3.3,
          m.size ? m.size * 3 : 10,
          ink,
        ),
        facility: m.id,
      });
    }

    shapes.push(...legendBands(state));
    height = 380;

    if (includeRoster) {
      const columns = 3;
      const perColumn = Math.ceil(FACILITIES.length / columns);
      let bottom = 365;
      for (let col = 0; col < columns; col++) {
        let y = 365;
        const cx = col * 174 + 80;
        for (const f of FACILITIES.slice(
          col * perColumn,
          (col + 1) * perColumn,
        )) {
          const record = (state.records[f.id] ?? {
            value: null,
            manual: null,
          }) as TerritoryRecord;
          const fill = colorOf(record, state.scale);
          shapes.push({ d: rectPath(col * 174, y - 5, 5, 5), fill });
          const title = `${f.index}. ${f.city} · ${valueText(record.value)}${record.value === null ? "" : "%"}${record.manual ? " (ручной цвет)" : ""}`;
          shapes.push(textShape(title, cx + 3, y, 5.1, 156));
          y += 6;
          const words = f.name.replace(/^БУ /, "").split(" ");
          let line = "";
          for (const word of words) {
            if ((line + " " + word).length > 57 && line) {
              shapes.push(textShape(line, cx + 3, y, 4.6, 156, "#63706B"));
              y += 5.5;
              line = word;
            } else line += (line ? " " : "") + word;
          }
          if (line) {
            shapes.push(textShape(line, cx + 3, y, 4.6, 156, "#63706B"));
            y += 5.5;
          }
          y += 5;
        }
        bottom = Math.max(bottom, y);
      }
      height = Math.ceil(bottom + 30);
    }
  } else {
    shapes.push(...legendBands(state));
    height = 350;
  }

  return { shapes, height };
}

export function regionName(index: number): string {
  return NAMES[index] ?? "";
}

export function facilityShortTitle(id: string): string {
  const f = FACILITIES.find((item) => item.id === id);
  return f ? `${f.index}. ${f.name.replace(/^БУ /, "")}` : id;
}
