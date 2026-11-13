import {
  FACILITY_POSITIONS,
  GROUPS,
  INSTITUTIONS,
  type Group,
} from "@/domain/disp/catalog";
import { pct, num } from "@/domain/disp/format";
import {
  facilityColor,
  facilityResult,
  groupColor,
  groupResult,
} from "@/domain/disp/scene/colors";
import { CELLS, GEO, TILES, type Tile } from "@/domain/disp/scene/layout";
import { BINS, EMPTY_COLOR, PALETTES } from "@/domain/disp/style/palettes";
import type { MetricResult } from "@/domain/disp/metrics/result";
import type { DispanserizationPayload } from "@/domain/presets/schema";
import { contrast } from "@/domain/shared/color";
import { flatTopHex, polygonPath, rectPath } from "@/domain/shared/geometry";
import { glyphAdvanceWidth, textShape } from "@/domain/shared/text";
import type { Shape } from "@/domain/shared/types";

const labelLines = (g: Group): string[] =>
  g.name.startsWith("Ханты-Мансий")
    ? ["Ханты-", "Мансийский" + (g.type === "city" ? "ск" : "")].map((s, i) =>
        i === 1 && g.type === "city" ? "Мансийск" : s,
      )
    : [g.name.replace(" район", "")];

export function mapShapes(state: DispanserizationPayload): Shape[] {
  const med = state.view === "med";
  const base = med ? state.medicalBase : state.view;
  const out: Shape[] = [];
  if (base === "geo") {
    for (const g of GEO.filter((g) => g.type === "district")) {
      out.push({
        d: g.d,
        fill: med ? "#F0F3F2" : groupColor(state, g.id),
        stroke: med ? "#DCE4DE" : state.outline,
        width: 1.05,
        group: med ? null : g.id,
      });
    }
    if (!med) {
      for (const g of GEO.filter((g) => g.type === "city")) {
        out.push({
          d: g.d,
          fill: groupColor(state, g.id),
          stroke: "#FFFFFF",
          width: 1.25,
          group: g.id,
        });
      }
    }
  } else {
    for (const t of TILES) {
      out.push({
        d: polygonPath(t.poly),
        fill: med ? "#EEF1EF" : groupColor(state, t.id),
        stroke: state.outline,
        width: 1.2,
        group: med ? null : t.id,
      });
    }
  }
  if (med) {
    for (const f of INSTITUTIONS) {
      const cell = CELLS.find((c) => c.id === f.id)!;
      const xy = FACILITY_POSITIONS[f.id]!;
      out.push({
        d: base === "hex" ? cell.d : polygonPath(flatTopHex(xy[0], xy[1], 5.9)),
        fill: facilityColor(state, f.id),
        stroke: base === "hex" ? state.outline : "#FFFFFF",
        width: base === "hex" ? 0.65 : 0.9,
        facility: f.id,
      });
    }
  } else if (state.labels) {
    const source: Array<Tile | (typeof GEO)[number]> =
      base === "hex" ? TILES : GEO.filter((g) => g.type === "district");
    const widths = [65, 74, 58, 44, 97, 41, 45, 75, 46];
    for (const g of source) {
      const lines = labelLines(g);
      const width =
        base === "hex" && "r" in g ? g.r * 1.62 : widths[g.district!]!;
      const size = base === "hex" ? 7.1 : 7.3;
      const fill = contrast(groupColor(state, g.id));
      lines.forEach((line, i) =>
        out.push({
          ...textShape(
            line,
            g.x,
            g.y + (i - (lines.length - 1) / 2) * 8 + 1,
            size,
            width,
            fill,
          ),
          group: g.id,
        }),
      );
      if (base === "hex" && g.type === "district") {
        out.push({
          ...textShape(
            "район",
            g.x,
            g.y + (lines.length - 1) * 4 + 11,
            4.7,
            45,
            fill,
          ),
          group: g.id,
        });
      }
    }
  }
  if (!med && base === "geo" && state.cityLabels) {
    const occupied: [number, number, number, number][] = [
      ...out.filter((s) => s.bbox).map((s) => s.bbox!),
      ...GEO.filter((g) => g.type === "city").map(
        (g) =>
          [g.x - 7, g.y - 7, g.x + 7, g.y + 7] as [
            number,
            number,
            number,
            number,
          ],
      ),
    ];
    for (const g of GEO.filter((g) => g.type === "city")) {
      const label = g.name;
      const width = Math.min(62, glyphAdvanceWidth(label) * 0.006);
      const candidates: { x: number; y: number; score: number }[] = [];
      for (let dy = -50; dy <= 50; dy += 5) {
        for (let dx = -55; dx <= 55; dx += 5) {
          candidates.push({
            x: g.x + dx,
            y: g.y + dy,
            score: dx * dx + dy * dy,
          });
        }
      }
      candidates.sort((a, b) => a.score - b.score);
      const p = candidates.find((cand) => {
        const r: [number, number, number, number] = [
          cand.x - width / 2 - 1,
          cand.y - 6,
          cand.x + width / 2 + 1,
          cand.y + 2,
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
      });
      if (p) {
        occupied.push([
          p.x - width / 2 - 1,
          p.y - 6,
          p.x + width / 2 + 1,
          p.y + 2,
        ]);
        out.push({
          d: `M${g.x},${g.y}L${p.x},${p.y - 3}`,
          stroke: "#9AAEA0",
          width: 0.45,
          fill: "none",
        });
        out.push({
          ...textShape(label, p.x, p.y, 6, width, "#466252"),
          group: g.id,
        });
      }
    }
  }
  return out;
}

export function legendShapes(state: DispanserizationPayload, y = 319): Shape[] {
  const out: Shape[] = [];
  [...BINS, "Нет данных"].forEach((label, i) => {
    const x = 6 + i * 84;
    out.push({
      d: rectPath(x, y, 8, 7),
      fill: i < 5 ? PALETTES[state.palette].colors[i] : EMPTY_COLOR,
    });
    out.push(textShape(label, x + 15, y + 6, 6.2, 64, "#698172", "left"));
  });
  return out;
}

export function exportMap(state: DispanserizationPayload): Shape[] {
  return [...mapShapes(state), ...legendShapes(state)];
}

function wrap(label: string, max = 49): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of label.split(" ")) {
    if (line.length + word.length + 1 > max && line) {
      lines.push(line);
      line = word;
    } else line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines;
}

export type DetailRow = {
  name: string;
  subtitle: string;
  color: string;
  result: MetricResult;
};

export function detailRows(state: DispanserizationPayload): DetailRow[] {
  return (state.view === "med" ? INSTITUTIONS : GROUPS).map((f) => {
    const medical = state.view === "med";
    const r = medical ? facilityResult(state, f.id) : groupResult(state, f.id);
    return {
      name: medical ? (f as (typeof INSTITUTIONS)[number]).short : f.name,
      subtitle: medical
        ? GROUPS.find(
            (g) => g.id === (f as (typeof INSTITUTIONS)[number]).group,
          )!.name
        : "",
      color: medical ? facilityColor(state, f.id) : groupColor(state, f.id),
      result: r,
    };
  });
}

export function appendixShapes(
  rows: DetailRow[],
  startY = 40,
): { shapes: Shape[]; height: number } {
  const out: Shape[] = [];
  let y = startY;
  for (let i = 0; i < rows.length; i += 2) {
    let rowHeight = 0;
    for (let col = 0; col < 2; col++) {
      const row = rows[i + col];
      if (!row) continue;
      const x = col * 265 + 3;
      const lines = wrap(row.name, 43);
      out.push({ d: rectPath(x, y - 5, 6, 6), fill: row.color });
      lines.forEach((line, k) =>
        out.push(textShape(line, x + 13, y + k * 8, 7, 232, "#354E40", "left")),
      );
      let next = y + lines.length * 8;
      if (row.subtitle) {
        out.push(
          textShape(row.subtitle, x + 13, next, 5.8, 232, "#8B9C90", "left"),
        );
        next += 8;
      }
      const info =
        row.result.percent === null
          ? "Не заполнено"
          : `${pct(row.result.percent)}   ·   ${num(row.result.fact)} / ${num(row.result.plan)}`;
      out.push(textShape(info, x + 13, next, 6.3, 232, "#6D8878", "left"));
      rowHeight = Math.max(rowHeight, next - y + 18);
    }
    y += rowHeight;
  }
  return { shapes: out, height: y + 20 };
}
