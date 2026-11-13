export type NumericRecord = {
  plan: number | null;
  fact: number | null;
};

export type MetricResult = {
  plan: number;
  fact: number;
  percent: number | null;
  active: string[];
  complete: string[];
  missing: string[];
  total: number;
};

export function result(
  records: Record<string, NumericRecord>,
  ids: string[],
): MetricResult {
  const active: string[] = [];
  const complete: string[] = [];
  const missing: string[] = [];
  let plan = 0;
  let fact = 0;

  for (const id of ids) {
    const row = records[id] ?? { plan: null, fact: null };
    const hasPlan = row.plan !== null;
    const hasFact = row.fact !== null;
    if (hasPlan || hasFact) active.push(id);
    if (hasPlan && hasFact) complete.push(id);
    else if (hasPlan || hasFact) missing.push(id);
    if (hasPlan) plan += row.plan ?? 0;
    if (hasFact) fact += row.fact ?? 0;
  }

  const percent =
    active.length && !missing.length && plan > 0 ? (fact / plan) * 100 : null;

  return {
    plan,
    fact,
    percent,
    active,
    complete,
    missing,
    total: ids.length,
  };
}

export function scaleColor(
  percent: number | null,
  colors: string[],
  emptyColor: string,
): string {
  if (percent === null) return emptyColor;
  if (percent < 50) return colors[0]!;
  if (percent < 75) return colors[1]!;
  if (percent < 90) return colors[2]!;
  if (percent <= 100) return colors[3]!;
  return colors[4]!;
}
