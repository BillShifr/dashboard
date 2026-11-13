/** Number formatting and plan/fact input parsing from disp HTML. */

export const validNumber = (n: unknown): boolean =>
  n === null ||
  (typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1e9);

export function parseInput(s: string): {
  valid: boolean;
  value: number | null;
} {
  if (s.trim() === "") return { valid: true, value: null };
  const v = s.replace(/\s/g, "").replace(",", ".");
  return {
    valid: /^\d+(?:\.\d{1,2})?$/.test(v) && validNumber(Number(v)),
    value: Number(v),
  };
}

export const pct = (n: number | null): string =>
  n === null
    ? ""
    : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n) +
      "%";

export const num = (n: number | null): string =>
  n === null
    ? ""
    : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);
