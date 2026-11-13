/** District labels, centers and palette from the territory HTML editor. */

export const NAMES = [
  "Белоярский район",
  "Берёзовский район",
  "Кондинский район",
  "Нефтеюганский район",
  "Нижневартовский район",
  "Октябрьский район",
  "Советский район",
  "Сургутский район",
  "Ханты-Мансийский район",
] as const;

export const CENTERS: ReadonlyArray<readonly [number, number]> = [
  [171, 103],
  [57, 105],
  [133, 243],
  [235, 229],
  [381, 183],
  [130, 151],
  [80, 178],
  [260, 165],
  [180, 199],
];

export const CITIES = [
  "Белоярский",
  "Берёзово",
  "Междуреченский",
  "Нефтеюганск",
  "Нижневартовск",
  "Октябрьское",
  "Советский",
  "Сургут",
  "Ханты-Мансийск",
] as const;

export const DISTRICT_LINES: ReadonlyArray<readonly [string, string]> = [
  ["Белоярский", "район"],
  ["Берёзовский", "район"],
  ["Кондинский", "район"],
  ["Нефтеюганский", "район"],
  ["Нижневартовский", "район"],
  ["Октябрьский", "район"],
  ["Советский", "район"],
  ["Сургутский", "район"],
  ["Ханты-Мансийский", "район"],
];

export const LABEL_WIDTHS = [67, 70, 43, 40, 102, 31, 39, 72, 44] as const;

/** City label max widths on geo base (district label widths differ). */
export const CITY_LABEL_WIDTHS = [67, 70, 42, 32, 102, 34, 29, 72, 38] as const;

export const PALETTE = [
  "#E5EEDB",
  "#9FC698",
  "#39755C",
  "#F2C75C",
  "#EC967E",
  "#AD3260",
] as const;
