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
    points.map((p) => p.map((v) => v.toFixed(4)).join(",")).join("L") +
    "Z"
  );
}

export function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${x},${y}L${x + w},${y}L${x + w},${y + h}L${x},${y + h}Z`;
}
