import { facilities, settlements } from './facilities.js';
import { hexPoints, hexLayout, polygonPath } from './geometry.js';

export const MISSING = '#D7DCDE';
export const ABOVE_TARGET = '#00C853';
export const scales = {
  traffic: {
    name: 'Красный → зелёный',
    colors: ['#D46A6A', '#E9A66C', '#E4D177', '#83BA75'],
  },
  green: {
    name: 'Светлый → зелёный',
    colors: ['#EDF3E7', '#C7DDB5', '#9AC789', '#579D6B'],
  },
  blue: {
    name: 'Голубой → бирюзовый',
    colors: ['#DEEBF5', '#A2C7DF', '#69A9C9', '#347F99'],
  },
};
export function validValue(value) {
  return (
    value === null ||
    (typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1000000)
  );
}
export function parseValue(text) {
  if (text.trim() === '') return { valid: true, value: null };
  const normal = text.trim().replace(',', '.');
  const value = Number(normal);
  return {
    valid: /^\d+(?:\.\d{1,2})?$/.test(normal) && validValue(value),
    value,
  };
}
export function scaleColor(value, scale = 'traffic') {
  if (value === null) return MISSING;
  if (value > 100) return ABOVE_TARGET;
  return scales[scale].colors[
    value < 25 ? 0 : value < 50 ? 1 : value < 75 ? 2 : 3
  ];
}
export function facilityColor(record, scale) {
  return record.manual || scaleColor(record.value, scale);
}
export const formattedValue = (value) =>
  value === null ? '—' : String(value).replace('.', ',');
export const newRecords = () =>
  Object.fromEntries(
    facilities.map((f) => [f.id, { value: null, manual: null }]),
  );
export const markerRadius = 6.5;
function geoMarkers() {
  return facilities.map((f) => {
    const group = facilities.filter((q) => q.city === f.city),
      i = group.indexOf(f);
    const cols = Math.min(4, Math.ceil(Math.sqrt(group.length))),
      rows = Math.ceil(group.length / cols);
    const [x, y] = settlements[f.city].center;
    const slot = f.city === 'Сургут' && i >= 12 ? i + 2 : i;
    return {
      ...f,
      x: x + ((slot % cols) - (cols - 1) / 2) * 15,
      y: y + (Math.floor(i / cols) - (rows - 1) / 2) * 18,
    };
  });
}
function hexMarkers() {
  const result = [];
  for (const block of hexLayout) {
    const group = facilities.filter((f) => f.area === block.id),
      candidates = [];
    // A regular lattice strictly inside each background hexagon.
    for (let row = -5; row <= 5; row++)
      for (let col = -6; col <= 6; col++) {
        const dx = col * 15,
          dy = row * 18;
        const inner = block.r - 8.2;
        if (
          Math.abs(dx) <= (inner * Math.sqrt(3)) / 2 &&
          Math.abs(dy) + Math.abs(dx) / Math.sqrt(3) <= inner
        )
          candidates.push({ x: block.x + dx, y: block.y + dy });
      }
    candidates.sort(
      (a, b) =>
        (a.x - block.x) ** 2 +
        (a.y - block.y) ** 2 -
        ((b.x - block.x) ** 2 + (b.y - block.y) ** 2),
    );
    if (candidates.length < group.length)
      throw Error('Not enough marker positions for area ' + block.id);
    const slots = candidates
      .slice(0, group.length)
      .sort((a, b) => a.y - b.y || a.x - b.x);
    group.forEach((f, i) => result.push({ ...f, ...slots[i] }));
  }
  return result;
}
export const markers = { geo: geoMarkers(), hex: hexMarkers() };
export const markerPath = (m) => polygonPath(hexPoints(m.x, m.y, markerRadius));
