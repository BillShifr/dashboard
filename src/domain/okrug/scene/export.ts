import type { OkrugPayload } from "@/domain/presets/schema";
import { okrugScene, orgTitle } from "@/domain/okrug/scene/scene";
import { templateOf } from "@/domain/okrug/bands";
import { shapesPagesToPdfBlob } from "@/domain/shared/pdf";
import { shapesToSvg } from "@/domain/shared/svg";

export function buildOkrugSvg(
  payload: OkrugPayload,
  interactive = false,
  selectedId: string | null = null,
): string {
  const { shapes, width, height } = okrugScene(payload, selectedId);
  return shapesToSvg(shapes, height, {
    interactive,
    selectedFacility: selectedId,
    facilityTitle: orgTitle,
    viewBox: `0 0 ${width} ${height}`,
    svgWidth: width * 2,
    svgHeight: height * 2,
    ariaLabel: payload.title || templateOf(payload).defaultTitle,
  });
}

export function okrugPngDimensions(): { width: number; height: number } {
  return { width: 1920, height: 1080 };
}

export function okrugExportFilename(
  payload: OkrugPayload,
  ext: "png" | "pdf",
): string {
  return `okrug-${payload.templateId}.${ext}`;
}

export function buildOkrugPdfBlob(payload: OkrugPayload): Blob {
  const { shapes, width, height } = okrugScene(payload);
  return shapesPagesToPdfBlob([
    { shapes, height, width, originX: 0, originY: 0 },
  ]);
}
