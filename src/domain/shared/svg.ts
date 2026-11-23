import { escapeXml } from "@/domain/shared/text";
import type { Shape } from "@/domain/shared/types";

export type ShapesToSvgOptions = {
  interactive?: boolean;
  selectedGroup?: string | null;
  selectedFacility?: string | null;
  groupTitle?: (id: string) => string;
  facilityTitle?: (id: string) => string;
  viewBox?: string;
  svgWidth?: number;
  svgHeight?: number;
  ariaLabel?: string;
};

export function shapesToSvg(
  shapes: Shape[],
  height = 330,
  {
    interactive = false,
    selectedGroup = null,
    selectedFacility = null,
    groupTitle,
    facilityTitle,
    viewBox = `-20 -15 540 ${height}`,
    svgWidth = 2160,
    svgHeight = height * 4,
    ariaLabel = "Карта Югры",
  }: ShapesToSvgOptions = {},
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${svgWidth}" height="${svgHeight}" role="group" aria-label="${escapeXml(ariaLabel)}">${shapes
    .map((s) => {
      const target = s.facility
        ? `data-facility="${s.facility}"`
        : s.group
          ? `data-group="${s.group}"`
          : "";
      const button = interactive && target && !s.label;
      const title = s.facility
        ? (facilityTitle?.(s.facility) ?? "")
        : s.group
          ? (groupTitle?.(s.group) ?? "")
          : "";
      const join = s.linejoin ?? "round";
      const stroke = s.stroke
        ? `stroke="${s.stroke}" stroke-width="${s.width}" stroke-linejoin="${join}"${join === "miter" ? ` stroke-miterlimit="8"` : ""}`
        : "";
      return `<path d="${s.d}" fill="${s.fill || "none"}" ${stroke} ${interactive ? target : ""} ${s.label ? `pointer-events="none" data-label="${escapeXml(s.label)}"` : ""} ${button ? `role="button" tabindex="0" aria-label="${escapeXml(title)}" aria-pressed="${s.facility ? s.facility === selectedFacility : !selectedFacility && s.group === selectedGroup}"` : ""}></path>`;
    })
    .join("")}</svg>`;
}
