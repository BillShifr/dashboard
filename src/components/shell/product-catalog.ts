import type { LucideIcon } from "lucide-react";
import { HexagonIcon, MapIcon, StethoscopeIcon } from "lucide-react";

export type ProductKind = "okrug" | "territory" | "dispanserization";

export type ProductDef = {
  kind: ProductKind;
  /** Старые подписи в API / домене */
  label: string;
  /** Подпись в сайдбаре и списке отчётов */
  reportLabel: string;
  short: string;
  icon: LucideIcon;
};

/** Два вида на стартовом экране; домен `territory` — «Инцидент №8». */
export type StartReportKind = "dispanserization" | "territory";

export const START_REPORT_KINDS: readonly StartReportKind[] = [
  "dispanserization",
  "territory",
] as const;

export const PRODUCT_CATALOG: readonly ProductDef[] = [
  {
    kind: "okrug",
    label: "Карта округа",
    reportLabel: "Карта округа",
    short: "Округ",
    icon: HexagonIcon,
  },
  {
    kind: "territory",
    label: "Территории",
    reportLabel: "Инцидент №8",
    short: "Инцидент №8",
    icon: MapIcon,
  },
  {
    kind: "dispanserization",
    label: "Диспансеризация",
    reportLabel: "Диспансеризация",
    short: "Диспансеризация",
    icon: StethoscopeIcon,
  },
] as const;

export function productOf(kind: ProductKind): ProductDef {
  return PRODUCT_CATALOG.find((p) => p.kind === kind) ?? PRODUCT_CATALOG[0]!;
}

export function reportKindLabel(kind: ProductKind): string {
  return productOf(kind).reportLabel;
}
