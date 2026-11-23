import {
  OKRUG_LEGEND_EMU,
  OKRUG_ORGS,
  OKRUG_SLIDE_SIZE,
  orgHex,
  type OkrugSlideNo,
} from "@/domain/okrug/catalog";
import {
  fillFor,
  legendCounts,
  okrugKpis,
  templateOf,
} from "@/domain/okrug/bands";
import type { OkrugPayload } from "@/domain/presets/schema";
import { contrast } from "@/domain/shared/color";
import {
  EMU_PER_PT,
  officeHexagonFromEmu,
  polygonPath,
} from "@/domain/shared/geometry";
import { textShape } from "@/domain/shared/text";
import type { Shape } from "@/domain/shared/types";

const TITLE_MAX = 800;
/** Единая геометрия сот региона — как на слайде 1; легенда остаётся по номеру слайда. */
const OKRUG_MAP_LAYOUT_SLIDE: OkrugSlideNo = 1;

function legendLabelX(
  slotX: number,
  slotW: number,
): { x: number; align: "left" | "center" } {
  const mid = slotX + slotW / 2;
  const slideMid = OKRUG_SLIDE_SIZE.width / 2;
  if (mid <= slideMid) {
    return { x: slotX + slotW + 8, align: "left" };
  }
  return { x: slotX + slotW + 8, align: "left" };
}

function pptHex(
  points: readonly (readonly [number, number])[],
  fill: string,
  stroke: string,
  width: number,
  facility?: string,
): Shape {
  return {
    d: polygonPath(points),
    fill,
    stroke,
    width,
    linejoin: "miter",
    facility,
  };
}

export function okrugScene(
  payload: OkrugPayload,
  selectedId: string | null = null,
): { shapes: Shape[]; width: number; height: number } {
  const template = templateOf(payload);
  const legendSlide = template.slide as OkrugSlideNo;
  const shapes: Shape[] = [
    {
      d: `M0,0L${OKRUG_SLIDE_SIZE.width},0L${OKRUG_SLIDE_SIZE.width},${OKRUG_SLIDE_SIZE.height}L0,${OKRUG_SLIDE_SIZE.height}Z`,
      fill: "#FFFFFF",
    },
  ];

  shapes.push(
    textShape(
      payload.title || template.defaultTitle,
      8,
      24,
      14,
      TITLE_MAX,
      "#2F5496",
      "left",
    ),
  );

  for (const org of OKRUG_ORGS) {
    const box = orgHex(org.id, OKRUG_MAP_LAYOUT_SLIDE);
    const fill = fillFor(payload, org.id);
    const ink = contrast(fill);
    const stroke =
      selectedId === org.id
        ? "#1F2F26"
        : fill.toLowerCase() === "#ffffff"
          ? "#C8CFC8"
          : "#FFFFFF";
    shapes.push(
      pptHex(
        box.points,
        fill,
        stroke,
        selectedId === org.id ? 1.8 : 0.75,
        org.id,
      ),
    );
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const lines = org.lines.length ? org.lines : [org.label];
    const size = lines.length > 2 ? 6.2 : lines.length === 2 ? 7.4 : 8.2;
    lines.forEach((line, i) => {
      shapes.push({
        ...textShape(
          line,
          cx,
          cy + (i - (lines.length - 1) / 2) * (size + 1.1) + 1.4,
          size,
          box.w * 0.72,
          ink,
        ),
        facility: org.id,
      });
    });
  }

  const legend = legendCounts(payload);
  const slots = OKRUG_LEGEND_EMU[legendSlide];
  slots.forEach((slot, index) => {
    const entry = legend[index];
    const fill = entry?.band.color ?? slot.color;
    const count = entry?.count ?? 0;
    const label = entry?.band.label ?? "";
    const x = slot.x / EMU_PER_PT;
    const y = slot.y / EMU_PER_PT;
    const w = slot.w / EMU_PER_PT;
    const h = slot.h / EMU_PER_PT;
    shapes.push(
      pptHex(
        officeHexagonFromEmu(slot.x, slot.y, slot.w, slot.h),
        fill,
        "#FFFFFF",
        0.75,
      ),
    );
    const lx = x + w / 2;
    const ly = y + h / 2 + 1.4;
    shapes.push(textShape(String(count), lx, ly, 9, w * 0.7, contrast(fill)));
    const { x: labelX, align: labelAlign } = legendLabelX(x, w);
    shapes.push(textShape(label, labelX, ly, 7.2, 220, "#1F2F26", labelAlign));
  });

  if (template.showKpi) {
    const kpi = okrugKpis(payload);
    const boxX = 720;
    const rows = [
      `${kpi.inRange} попали в диапазон`,
      `${kpi.below} не попали в диапазон`,
      `${kpi.above} превысили диапазон`,
      `Доля вне диапазона ${kpi.outShare}%`,
      kpi.average === null
        ? "Нет среднего — импортируйте Excel"
        : `Среднее по МО ${kpi.average}${template.unit}`,
    ];
    if (payload.extras.period) rows.push(payload.extras.period);
    rows.forEach((line, i) => {
      shapes.push(
        textShape(line, boxX, 360 + i * 16, 7, 220, "#1F2F26", "left"),
      );
    });
  }

  return {
    shapes,
    width: OKRUG_SLIDE_SIZE.width,
    height: OKRUG_SLIDE_SIZE.height,
  };
}

export function orgTitle(id: string): string {
  const org = OKRUG_ORGS.find((o) => o.id === id);
  return org ? `${org.label} · ${org.name}` : id;
}
