import { escapeXml } from "@/domain/shared/text";
import type { Shape } from "@/domain/shared/types";

export type ShapesToSvgOptions = {
  interactive?: boolean;
  selectedGroup?: string | null;
  selectedFacility?: string | null;
  groupTitle?: (id: string) => string;
  facilityTitle?: (id: string) => string;
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
  }: ShapesToSvgOptions = {},
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -15 540 ${height}" width="2160" height="${height * 4}" role="group" aria-label="Карта Югры">${shapes
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
      return `<path d="${s.d}" fill="${s.fill || "none"}" ${s.stroke ? `stroke="${s.stroke}" stroke-width="${s.width}" stroke-linejoin="round"` : ""} ${interactive ? target : ""} ${s.label ? `pointer-events="none" data-label="${escapeXml(s.label)}"` : ""} ${button ? `role="button" tabindex="0" aria-label="${escapeXml(title)}" aria-pressed="${s.facility ? s.facility === selectedFacility : !selectedFacility && s.group === selectedGroup}"` : ""}></path>`;
    })
    .join("")}</svg>`;
}
