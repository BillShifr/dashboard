import { rectPath } from "@/domain/shared/geometry";
import { glyphAdvanceWidth, textShape } from "@/domain/shared/text";
import type { Shape } from "@/domain/shared/types";

export const SLIDE_LOGO = {
  href: "/tfoms-logo.jpg",
  x: 859,
  y: 2,
  w: 69,
  h: 68,
} as const;

export const DEFAULT_NUMERATOR =
  "средняя фактическая ЗП по категории за 9 месяцев 2026 года";
export const DEFAULT_DENOMINATOR =
  "среднемесячный доход от трудовой деятельности по категории";

export type SlideCell = {
  text: string;
  bold: boolean;
  size: number;
  color: string;
  fill: string;
  colSpan?: number;
  rowSpan?: number;
};

const cell = (text: string, patch: Partial<SlideCell> = {}): SlideCell => ({
  text,
  bold: false,
  size: 9,
  color: "#1F2F26",
  fill: "#FFFFFF",
  ...patch,
});

/** Сетка сводки справа снизу, как объект на слайде 1. */
export const DEFAULT_SUMMARY: SlideCell[][] = [
  [
    cell("Параметр", { bold: true, size: 8 }),
    cell("на 01.01.2026 г.", { bold: true, size: 8 }),
    cell(""),
    cell("на 01.10.2026 г.", { bold: true, size: 8 }),
    cell(""),
  ],
  [
    cell("Целевой показатель", { bold: true, size: 8 }),
    cell("212,89", { bold: true, size: 8 }),
    cell(""),
    cell("220,35", { bold: true, size: 8 }),
    cell("+103,5%", { bold: true, size: 8, color: "#1B7A3A" }),
  ],
  [
    cell("Фактическое значение", { bold: true, size: 8 }),
    cell("218,00", { bold: true, size: 8 }),
    cell("204,8%", { bold: true, size: 8, fill: "#92D050" }),
    cell("216,29", { bold: true, size: 8 }),
    cell("196,3%", { bold: true, size: 8, fill: "#E85D5D", color: "#FFFFFF" }),
  ],
  [
    cell("Топ МО ХМАО — Югры, требующих улучшения показателей", {
      bold: true,
      size: 8,
    }),
    cell("1"),
    cell("Сур-я ГКП №2 (150,5%)", { bold: true, color: "#C00000" }),
    cell(""),
    cell(""),
  ],
  [
    cell(""),
    cell("2"),
    cell("Нижн-я ГДСП (151,3%)", { bold: true, color: "#C00000" }),
    cell(""),
    cell(""),
  ],
  [
    cell(""),
    cell("3"),
    cell("Сур-я РП (151,8%)", { bold: true, color: "#C00000" }),
    cell(""),
    cell(""),
  ],
];

export const SUMMARY_BOX = { x: 609, y: 371, w: 332, h: 141 } as const;
export const SUMMARY_COLS = [118, 46, 56, 56, 56] as const;

export type SummaryPlacement = {
  row: number;
  col: number;
  cell: SlideCell;
  x: number;
  y: number;
  w: number;
  h: number;
  align: "left" | "center";
};

function columnOffset(col: number) {
  return SUMMARY_COLS.slice(0, col).reduce((sum, width) => sum + width, 0);
}

/** Форма сводки со слайда 1: даты на две колонки, подпись топа на три строки, названия МО до правого края. */
function templateSpan(
  rows: number,
  cols: number,
  row: number,
  col: number,
): { colSpan: number; rowSpan: number } {
  if (rows !== 6 || cols !== 5) return { colSpan: 1, rowSpan: 1 };
  if (row === 0 && (col === 1 || col === 3)) return { colSpan: 2, rowSpan: 1 };
  if (row === 1 && col === 1) return { colSpan: 2, rowSpan: 1 };
  if (row === 3 && col === 0) return { colSpan: 1, rowSpan: 3 };
  if (row >= 3 && col === 2) return { colSpan: 3, rowSpan: 1 };
  return { colSpan: 1, rowSpan: 1 };
}

function cellAlign(
  row: number,
  col: number,
  colSpan: number,
  rowSpan: number,
): "left" | "center" {
  if (row === 0 || (col === 0 && rowSpan > 1)) return "center";
  if (col === 0 || colSpan >= 3) return "left";
  return "center";
}

export function summaryPlacements(summary: SlideCell[][]): SummaryPlacement[] {
  const rowCount = summary.length || 1;
  const colCount = summary[0]?.length ?? 0;
  const rowH = SUMMARY_BOX.h / rowCount;
  const covered = new Set<string>();
  const placements: SummaryPlacement[] = [];

  summary.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      if (covered.has(`${rowIndex}:${colIndex}`)) return;
      const span = templateSpan(rowCount, colCount, rowIndex, colIndex);
      for (let dr = 0; dr < span.rowSpan; dr += 1) {
        for (let dc = 0; dc < span.colSpan; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          covered.add(`${rowIndex + dr}:${colIndex + dc}`);
        }
      }
      placements.push({
        row: rowIndex,
        col: colIndex,
        cell: { ...item, ...span },
        x: SUMMARY_BOX.x + columnOffset(colIndex),
        y: SUMMARY_BOX.y + rowIndex * rowH,
        w: columnOffset(colIndex + span.colSpan) - columnOffset(colIndex),
        h: rowH * span.rowSpan,
        align: cellAlign(rowIndex, colIndex, span.colSpan, span.rowSpan),
      });
    });
  });

  return placements;
}

export function wrapSlideText(text: string, size: number, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const widthOf = (line: string) => (glyphAdvanceWidth(line) * size) / 1000;
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (current && widthOf(trial) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function resolveChrome(input: {
  title: string;
  numerator?: string;
  denominator?: string;
  summary?: SlideCell[][];
}) {
  return {
    title: input.title,
    numerator: input.numerator?.trim() ? input.numerator : DEFAULT_NUMERATOR,
    denominator: input.denominator?.trim()
      ? input.denominator
      : DEFAULT_DENOMINATOR,
    summary: input.summary?.length ? input.summary : DEFAULT_SUMMARY,
  };
}

export function drawSlideChrome(
  chrome: ReturnType<typeof resolveChrome>,
  options: { text: boolean },
): Shape[] {
  const shapes: Shape[] = [];
  shapes.push({
    d: `M15,71 L930,71`,
    fill: "none",
    stroke: "#2F5496",
    width: 1.4,
  });
  shapes.push({
    d: `M12,512 L940,512`,
    fill: "none",
    stroke: "#70AD47",
    width: 3,
  });
  if (options.text) {
    shapes.push({
      d: "M0,0",
      fill: "none",
      image: { ...SLIDE_LOGO },
    });
  }

  shapes.push(textShape("=", 10, 96, 11, 20, "#2F5496", "left"));
  shapes.push({
    d: "M28,96 L470,96",
    fill: "none",
    stroke: "#2F5496",
    width: 0.8,
  });
  shapes.push(textShape(", %", 476, 96, 11, 40, "#2F5496", "left"));
  if (options.text) {
    shapes.push(textShape(chrome.title, 8, 36, 13, 790, "#2F5496", "left"));
    shapes.push(textShape(chrome.numerator, 28, 88, 9, 470, "#2F5496", "left"));
    shapes.push(
      textShape(chrome.denominator, 28, 108, 9, 430, "#2F5496", "left"),
    );
  }

  for (const place of summaryPlacements(chrome.summary)) {
    const { cell: item, x, y, w, h, align } = place;
    shapes.push({
      d: rectPath(x, y, w, h),
      fill: item.fill,
      stroke: "#1F2F26",
      width: 0.6,
    });
    if (!options.text || !item.text) continue;
    const pad = 4;
    const lines = wrapSlideText(item.text, item.size, w - pad * 2);
    const lineH = item.size * 1.2;
    let baseline = y + (h - lines.length * lineH) / 2 + item.size * 0.82;
    for (const line of lines) {
      const tx = align === "center" ? x + w / 2 : x + pad;
      shapes.push(
        textShape(
          line,
          tx,
          baseline,
          item.size,
          w - pad * 2,
          item.color,
          align,
        ),
      );
      if (item.bold) {
        shapes.push(
          textShape(
            line,
            tx + 0.35,
            baseline,
            item.size,
            w - pad * 2,
            item.color,
            align,
          ),
        );
      }
      baseline += lineH;
    }
  }

  if (options.text) {
    shapes.push(textShape("1", 900, 528, 10, 20, "#1F2F26"));
  }
  return shapes;
}
