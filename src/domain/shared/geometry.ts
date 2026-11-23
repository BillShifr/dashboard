/** Flat-top hexagon vertices and SVG polygon path helpers. */

export function flatTopHex(
  x: number,
  y: number,
  r: number,
): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => [
    x + r * Math.cos((i * Math.PI) / 3),
    y + r * Math.sin((i * Math.PI) / 3),
  ]);
}

export function polygonPath(
  points: ReadonlyArray<ReadonlyArray<number>>,
): string {
  return (
    "M" +
    points.map((p) => p.map((v) => v.toFixed(6)).join(",")).join("L") +
    "Z"
  );
}

export function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${x},${y}L${x + w},${y}L${x + w},${y + h}L${x},${y + h}Z`;
}

export const EMU_PER_PT = 12700;

/**
 * PowerPoint `prstGeom="hexagon"` (ECMA-376): flat-top, adj=25000.
 * Inset is `min(w,h)*adj`, not `w*adj`.
 */
export function officeHexagon(
  x: number,
  y: number,
  w: number,
  h: number,
  adj = 0.25,
): [number, number][] {
  const inset = Math.min(w, h) * adj;
  return [
    [x + inset, y],
    [x + w - inset, y],
    [x + w, y + h / 2],
    [x + w - inset, y + h],
    [x + inset, y + h],
    [x, y + h / 2],
  ];
}

/** Same hexagon from PowerPoint EMU box (`a:off` + `a:ext`, default adj 25000). */
export function officeHexagonFromEmu(
  x: number,
  y: number,
  w: number,
  h: number,
  adj = 25000,
): [number, number][] {
  return officeHexagon(
    x / EMU_PER_PT,
    y / EMU_PER_PT,
    w / EMU_PER_PT,
    h / EMU_PER_PT,
    adj / 100000,
  );
}
