import { OKRUG_ORGS } from "@/domain/okrug/catalog";
import type { OkrugPayload } from "@/domain/presets/schema";
import {
  OKRUG_COLORS,
  OKRUG_TEMPLATE_BY_ID,
  type OkrugBand,
  type OkrugMetric,
  type OkrugTemplate,
} from "@/domain/okrug/templates";

export function templateOf(payload: OkrugPayload): OkrugTemplate {
  return OKRUG_TEMPLATE_BY_ID[payload.templateId];
}

export function metricValue(
  payload: OkrugPayload,
  id: string,
  metric: OkrugMetric = templateOf(payload).metric,
): number | null {
  const row = payload.records[id];
  if (!row) return null;
  return row[metric];
}

export function bandMatches(band: OkrugBand, value: number | null): boolean {
  if (band.missing && value === null) return true;
  if (band.zeroMissing && value === 0) return true;
  if (band.missing || band.zeroMissing) return false;
  if (value === null) return false;
  if (band.min !== null && value < band.min) return false;
  if (band.max !== null) {
    if (band.maxInclusive) {
      if (value > band.max) return false;
    } else if (value >= band.max) return false;
  }
  return true;
}

export function bandFor(
  template: OkrugTemplate,
  value: number | null,
): OkrugBand | null {
  const missing = template.bands.filter((b) => b.missing || b.zeroMissing);
  const rest = template.bands.filter((b) => !b.missing && !b.zeroMissing);
  return [...missing, ...rest].find((band) => bandMatches(band, value)) ?? null;
}

export function fillFor(payload: OkrugPayload, id: string): string {
  const template = templateOf(payload);
  const value = metricValue(payload, id);
  return bandFor(template, value)?.color ?? OKRUG_COLORS.empty;
}

/** Ручной цвет и граница поверх правила Excel. Пустое поле значит «как в диапазоне». */
export function paintOf(payload: OkrugPayload, id: string) {
  const custom = payload.extras.appearance?.[id];
  const fill = custom?.fill || fillFor(payload, id);
  return {
    fill,
    stroke: custom?.stroke || "#FFFFFF",
  };
}

export type OkrugLegendItem = {
  band: OkrugBand;
  count: number;
};

export function legendCounts(payload: OkrugPayload): OkrugLegendItem[] {
  const template = templateOf(payload);
  return template.bands.map((band) => ({
    band,
    count: OKRUG_ORGS.filter(
      (org) => bandFor(template, metricValue(payload, org.id))?.id === band.id,
    ).length,
  }));
}

export function participatingIds(payload: OkrugPayload): string[] {
  const template = templateOf(payload);
  return OKRUG_ORGS.filter((org) => {
    const value = metricValue(payload, org.id);
    const none = template.bands.find((b) => b.missing || b.zeroMissing);
    if (none && bandMatches(none, value)) return false;
    return value !== null;
  }).map((org) => org.id);
}

export function okrugKpis(payload: OkrugPayload): {
  inRange: number;
  below: number;
  above: number;
  none: number;
  outShare: number;
  average: number | null;
  filled: number;
} {
  const items = legendCounts(payload);
  const pick = (id: string) => items.find((i) => i.band.id === id)?.count ?? 0;
  const inRange = pick("in");
  const below = pick("below");
  const above = pick("above");
  const none = pick("none") + pick("zero");
  const filled = participatingIds(payload).length;
  const values = participatingIds(payload)
    .map((id) => metricValue(payload, id))
    .filter((v): v is number => v !== null);
  const average =
    values.length === 0
      ? null
      : Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) /
        10;
  const outShare =
    filled === 0 ? 0 : Math.round(((below + above) / filled) * 100);
  return { inRange, below, above, none, outShare, average, filled };
}
