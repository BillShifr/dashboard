import {
  appendixShapes,
  detailRows,
  exportMap,
  mapShapes,
} from "@/domain/disp/scene/mapShapes";
import { facilityShort, groupName } from "@/domain/disp/scene/colors";
import type { DispanserizationPayload } from "@/domain/presets/schema";
import { shapesPagesToPdfBlob, type PdfPage } from "@/domain/shared/pdf";
import { shapesToSvg } from "@/domain/shared/svg";
import { textShape } from "@/domain/shared/text";
import type { Shape } from "@/domain/shared/types";

export { shapesPagesToPdfBlob };

export function exportViewLabel(view: DispanserizationPayload["view"]): string {
  return view === "med"
    ? "учреждения"
    : view === "hex"
      ? "шестиугольники"
      : "карта";
}

export function dispExportFilename(
  state: DispanserizationPayload,
  ext: "png" | "pdf" | "svg",
): string {
  return `Югра — ${exportViewLabel(state.view)}.${ext}`;
}

export function buildDispSvg(
  state: DispanserizationPayload,
  interactive = false,
  options: {
    selectedGroup?: string | null;
    selectedFacility?: string | null;
    height?: number;
    shapes?: Shape[];
  } = {},
): string {
  const shapes = options.shapes ?? mapShapes(state);
  return shapesToSvg(shapes, options.height ?? 330, {
    interactive,
    selectedGroup: options.selectedGroup ?? null,
    selectedFacility: options.selectedFacility ?? null,
    groupTitle: groupName,
    facilityTitle: facilityShort,
  });
}

export function pngScene(state: DispanserizationPayload): {
  shapes: Shape[];
  height: number;
} {
  const shapes = exportMap(state);
  let height = 365;
  if (state.showDetails) {
    const details = appendixShapes(detailRows(state), 370);
    shapes.push(...details.shapes);
    height = details.height + 20;
  }
  return { shapes, height };
}

export function pdfPages(state: DispanserizationPayload): PdfPage[] {
  const pages: PdfPage[] = [
    {
      shapes: [
        ...exportMap(state),
        textShape("Диспансеризация · 9 месяцев 2026", 250, -2, 9, 480),
      ],
      height: 365,
    },
  ];
  if (state.showDetails) {
    const rows = detailRows(state);
    for (let i = 0; i < rows.length; i += 24) {
      const details = appendixShapes(rows.slice(i, i + 24), 40);
      pages.push({
        height: Math.max(400, details.height + 25),
        shapes: [
          textShape(
            state.view === "med" ? "Медицинские учреждения" : "Территории Югры",
            3,
            8,
            12,
            500,
            "#324D3D",
            "left",
          ),
          ...details.shapes,
        ],
      });
    }
  }
  return pages;
}

export function buildDispPdfBlob(state: DispanserizationPayload): Blob {
  return shapesPagesToPdfBlob(pdfPages(state));
}
