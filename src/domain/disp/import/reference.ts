import { INSTITUTIONS } from "@/domain/disp/catalog";
import type { DispanserizationPayload } from "@/domain/presets/schema";

/** Справочные план/факт из утверждённого каталога (как «Вернуть данные Excel» в HTML). */
export function referenceDispRecords(): DispanserizationPayload["records"] {
  return Object.fromEntries(
    INSTITUTIONS.map((f) => [
      f.id,
      { plan: f.plan, fact: f.fact, color: null },
    ]),
  );
}

export function applyReferenceToPayload(
  payload: DispanserizationPayload,
): DispanserizationPayload {
  return {
    ...payload,
    records: referenceDispRecords(),
    groupColors: {},
  };
}
