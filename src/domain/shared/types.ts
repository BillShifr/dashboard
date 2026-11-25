/** Generic vector shape used by SVG/PDF exporters. */

export type Shape = {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  linejoin?: "round" | "miter";
  group?: string | null;
  facility?: string;
  label?: string;
  bbox?: [number, number, number, number];
  image?: { href: string; x: number; y: number; w: number; h: number };
};
