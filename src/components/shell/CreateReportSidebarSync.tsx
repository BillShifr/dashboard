"use client";

import { useLayoutEffect } from "react";
import { useConstructor } from "@/components/shell/constructor-context";
import {
  PRODUCT_CATALOG,
  START_REPORT_KINDS,
  type StartReportKind,
} from "@/components/shell/product-catalog";

const FORM_HINT: Record<StartReportKind, string> = {
  dispanserization: "План и факт по диспансеризации",
  territory: "Показатели по округу (инцидент №8)",
};

/**
 * Стартовый экран: только выбор формы отчёта. Вид карты — в редакторе.
 */
export function CreateReportSidebarSync({
  kind,
  onKindChange,
}: {
  kind: StartReportKind;
  onKindChange: (kind: StartReportKind) => void;
}) {
  const { setCatalogSections } = useConstructor();

  useLayoutEffect(() => {
    setCatalogSections([
      {
        title: "Форма отчёта",
        items: START_REPORT_KINDS.map((k) => {
          const product = PRODUCT_CATALOG.find((p) => p.kind === k)!;
          return {
            id: k,
            label: product.reportLabel,
            hint: FORM_HINT[k],
            active: kind === k,
            onSelect: () => onKindChange(k),
          };
        }),
      },
    ]);
    return () => setCatalogSections([]);
  }, [kind, onKindChange, setCatalogSections]);

  return null;
}
