import { GROUPS, INSTITUTIONS } from "@/domain/disp/catalog";
import { result, scaleColor } from "@/domain/disp/metrics/result";
import { EMPTY_COLOR, PALETTES } from "@/domain/disp/style/palettes";
import type { DispanserizationPayload } from "@/domain/presets/schema";

export function groupIds(groupId: string): string[] {
  return INSTITUTIONS.filter((f) => f.group === groupId).map((f) => f.id);
}

export function groupResult(state: DispanserizationPayload, id: string) {
  return result(state.records, groupIds(id));
}

export function facilityResult(state: DispanserizationPayload, id: string) {
  return result(state.records, [id]);
}

export function totalResult(state: DispanserizationPayload) {
  return result(
    state.records,
    INSTITUTIONS.map((f) => f.id),
  );
}

export function groupColor(state: DispanserizationPayload, id: string): string {
  return (
    state.groupColors[id] ||
    scaleColor(
      groupResult(state, id).percent,
      [...PALETTES[state.palette].colors],
      EMPTY_COLOR,
    )
  );
}

export function facilityColor(
  state: DispanserizationPayload,
  id: string,
): string {
  const record = state.records[id];
  return (
    record?.color ||
    scaleColor(
      facilityResult(state, id).percent,
      [...PALETTES[state.palette].colors],
      EMPTY_COLOR,
    )
  );
}

export function groupName(id: string): string {
  return GROUPS.find((g) => g.id === id)?.name ?? "";
}

export function facilityShort(id: string): string {
  return INSTITUTIONS.find((f) => f.id === id)?.short ?? "";
}
