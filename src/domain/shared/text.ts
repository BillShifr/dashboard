import { glyphs } from "@/domain/shared/glyphs.js";
import type { Shape } from "@/domain/shared/types";

type GlyphCommand = {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

type Glyph = {
  width: number;
  commands: GlyphCommand[];
};

const GLYPHS = glyphs as Record<string, Glyph>;

export function escapeXml(s: string): string {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }) as Record<string, string>
      )[c]!,
  );
}

const norm = (s: string) => String(s).replace(/[\u00a0\u202f]/g, " ");

export function textPath(
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth = 1000,
  align: "center" | "left" = "center",
): string {
  text = norm(text);
  const gs = [...text].map((c) => GLYPHS[c] || GLYPHS["?"] || GLYPHS[" "]!);
  const width = gs.reduce((s, g) => s + g.width, 0);
  size = Math.min(size, (maxWidth * 1000) / (width || 1));
  let cursor = x - (align === "center" ? (width * size) / 2000 : 0);
  let d = "";
  const scale = size / 1000;
  for (const g of gs) {
    for (const c of g.commands) {
      d += c.type;
      for (const [a, b] of [
        ["x1", "y1"],
        ["x2", "y2"],
        ["x", "y"],
      ] as const) {
        if (c[a] !== undefined) {
          d +=
            (cursor + c[a]! * scale).toFixed(3) +
            "," +
            (y + c[b]! * scale).toFixed(3) +
            " ";
        }
      }
    }
    cursor += g.width * scale;
  }
  return d;
}

export function textShape(
  label: string,
  x: number,
  y: number,
  size = 7,
  width = 500,
  fill = "#41584A",
  align: "center" | "left" = "center",
): Shape {
  const w = Math.min(
    width,
    ([...norm(label)].reduce((s, c) => s + (GLYPHS[c]?.width || 400), 0) *
      size) /
      1000,
  );
  return {
    d: textPath(label, x, y, size, width, align),
    fill,
    label,
    bbox: [
      x - (align === "center" ? w / 2 : 0) - 1,
      y - size * 0.85 - 1,
      x + (align === "center" ? w / 2 : w) + 1,
      y + size * 0.3 + 1,
    ],
  };
}

export function glyphAdvanceWidth(label: string): number {
  return [...norm(label)].reduce((s, c) => s + (GLYPHS[c]?.width || 400), 0);
}
