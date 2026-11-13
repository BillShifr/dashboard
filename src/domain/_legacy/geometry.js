// Every block is a regular, point-up hexagon. Distance is measured edge-to-edge.
export const HEX_GAP = 6;
export function hexPoints(x, y, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 90) * Math.PI) / 180;
    return [x + r * Math.cos(a), y + r * Math.sin(a)];
  });
}
export const polygonPath = (points) =>
  'M' + points.map((p) => p.map((v) => v.toFixed(4)).join(',')).join('L') + 'Z';
function pointSegment(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy),
    ),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
export function polygonDistance(a, b) {
  let separated = false;
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i],
        q = poly[(i + 1) % poly.length],
        axis = [q[1] - p[1], p[0] - q[0]];
      const ranges = [a, b].map((points) =>
        points.map((v) => v[0] * axis[0] + v[1] * axis[1]),
      );
      if (
        Math.max(...ranges[0]) < Math.min(...ranges[1]) ||
        Math.max(...ranges[1]) < Math.min(...ranges[0])
      )
        separated = true;
    }
  if (!separated) return 0;
  let distance = Infinity;
  for (const [points, edges] of [
    [a, b],
    [b, a],
  ])
    for (const p of points)
      for (let i = 0; i < edges.length; i++)
        distance = Math.min(
          distance,
          pointSegment(p, edges[i], edges[(i + 1) % edges.length]),
        );
  return distance;
}
function layout() {
  const placed = [];
  // id, radius, existing neighbour, direction. Geography sets relative placement;
  // exact polygon distances set spacing, including collisions with all other blocks.
  const specification = [
    [1, 61, null, 0],
    [0, 38, 1, 0],
    [5, 35, 1, 60],
    [6, 27, 5, 180],
    [2, 43, 6, 60],
    [8, 35, 5, 0],
    [3, 27, 8, 60],
    [7, 54, 8, 0],
    [4, 66, 7, 0],
  ];
  for (const [id, r, parent, angle] of specification) {
    let x = 65,
      y = 65;
    if (parent !== null) {
      const anchor = placed.find((p) => p.id === parent),
        a = (angle * Math.PI) / 180;
      const at = (distance) =>
        hexPoints(
          anchor.x + distance * Math.cos(a),
          anchor.y + distance * Math.sin(a),
          r,
        );
      const clearance = (distance) =>
        Math.min(...placed.map((p) => polygonDistance(at(distance), p.points)));
      let lo = 0,
        hi = 1;
      while (clearance(hi) < HEX_GAP) {
        lo = hi;
        hi += 1;
      }
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (clearance(mid) < HEX_GAP) lo = mid;
        else hi = mid;
      }
      x = anchor.x + hi * Math.cos(a);
      y = anchor.y + hi * Math.sin(a);
    }
    placed.push({ id, x, y, r, points: hexPoints(x, y, r) });
  }
  return placed
    .map((p) => ({
      ...p,
      x: p.x + 33,
      y: p.y + 25,
      points: hexPoints(p.x + 33, p.y + 25, p.r),
    }))
    .sort((a, b) => a.id - b.id);
}
export const hexLayout = layout();
