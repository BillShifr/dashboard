import type { TerritoryPayload } from "@/domain/presets/schema";
import { shapesPagesToPdfBlob } from "@/domain/shared/pdf";
import { shapesToSvg } from "@/domain/shared/svg";
import {
  facilityShortTitle,
  regionName,
  scene,
} from "@/domain/territory/scene/scene";

export { shapesPagesToPdfBlob };

export function territoryExportStem(state: TerritoryPayload): string {
  if (state.mode === "med") return `yugra-medical-${state.medicalBase}`;
  return state.mode === "geo" ? "yugra-map" : "yugra-hexagons";
}

export function territoryExportFilename(
  state: TerritoryPayload,
  ext: "png" | "pdf" | "svg",
): string {
  return `${territoryExportStem(state)}.${ext}`;
}

export function buildTerritorySvg(
  state: TerritoryPayload,
  interactive = false,
  options: {
    selectedGroup?: string | null;
    selectedFacility?: string | null;
  } = {},
): string {
  const { shapes, height } = scene(state, !interactive);
  return shapesToSvg(shapes, height, {
    interactive,
    selectedGroup: options.selectedGroup ?? null,
    selectedFacility: options.selectedFacility ?? null,
    groupTitle: (id) => regionName(Number(id)),
    facilityTitle: facilityShortTitle,
  });
}

/** PNG canvas size matching HTML export (`width=2160`, `height * 4`). */
export function territoryPngDimensions(state: TerritoryPayload): {
  width: number;
  height: number;
  sceneHeight: number;
} {
  const { height: sceneHeight } = scene(state, true);
  return { width: 2160, height: sceneHeight * 4, sceneHeight };
}

export function buildTerritoryPdfBlob(state: TerritoryPayload): Blob {
  const output = scene(state, true);
  return shapesPagesToPdfBlob([
    { shapes: output.shapes, height: output.height },
  ]);
}
