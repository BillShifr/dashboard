/** Режимы карты в payload territory (`mode`) / disp (`view`). */
export type MapDisplayViewId = "geo" | "hex" | "med";

export type MapDisplayViewDef = {
  id: MapDisplayViewId;
  /** Подпись в сайдбаре — как на утверждённых макетах и в шапке холста. */
  label: string;
};

/** Инцидент №8 — три вида одной и той же карты МО. */
export const INCIDENT_8_DISPLAY_VIEWS: readonly MapDisplayViewDef[] = [
  { id: "geo", label: "Карта" },
  { id: "hex", label: "Соты" },
] as const;

/** Диспансеризация — те же три визуала, своя логика план/факт. */
export const DISP_DISPLAY_VIEWS: readonly MapDisplayViewDef[] = [
  { id: "geo", label: "Карта" },
  { id: "hex", label: "Соты территорий" },
  { id: "med", label: "Учреждения" },
] as const;
