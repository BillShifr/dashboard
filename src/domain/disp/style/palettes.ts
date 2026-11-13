/** Scale palettes and legend bins from disp HTML. */

export const PALETTES = {
  traffic: {
    name: "Светофор",
    colors: ["#D97878", "#E7B16B", "#DDD18B", "#78AF91", "#00AA65"],
  },
  green: {
    name: "Зелёная",
    colors: ["#E4EDE6", "#C5DCCB", "#9DC6AC", "#66A184", "#008558"],
  },
  blue: {
    name: "Синяя",
    colors: ["#E0EAF1", "#B8D3E3", "#82B7CE", "#478FAA", "#00AA65"],
  },
} as const;

export type PaletteId = keyof typeof PALETTES;

export const EMPTY_COLOR = "#E8ECEF";

export const BINS = ["< 50%", "50–75%", "75–90%", "90–100%", "> 100%"] as const;
