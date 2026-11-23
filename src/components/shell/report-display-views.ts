/** Режимы карты в payload territory (`mode`) / disp (`view`). */
export type MapDisplayViewId = "geo" | "hex" | "med";

export type MapDisplayViewDef = {
  id: MapDisplayViewId;
  /** Подпись в сайдбаре — как на утверждённых макетах и в шапке холста. */
  label: string;
};

/** Число БУ в каталоге территорий. Держать равным `facilities.length`. */
const TERRITORY_BU = 63;

/** Инцидент №8 — три утверждённых макета. */
export const INCIDENT_8_DISPLAY_VIEWS: readonly MapDisplayViewDef[] = [
  { id: "geo", label: "9 районов" },
  { id: "hex", label: "Соты МО" },
  { id: "med", label: `${TERRITORY_BU} БУ` },
] as const;

/** Диспансеризация — те же три визуала, своя логика план/факт. */
export const DISP_DISPLAY_VIEWS: readonly MapDisplayViewDef[] = [
  { id: "geo", label: "Карта" },
  { id: "hex", label: "Соты территорий" },
  { id: "med", label: "Учреждения" },
] as const;
