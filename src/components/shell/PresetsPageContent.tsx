"use client";

import Link from "next/link";
import { useState } from "react";
import { CreatePresetForm } from "@/components/editor/CreatePresetForm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreateReportSidebarSync } from "@/components/shell/CreateReportSidebarSync";
import {
  productOf,
  reportKindLabel,
  type ProductKind,
  type StartReportKind,
} from "@/components/shell/product-catalog";

type PresetRow = {
  id: string;
  name: string;
  kind: ProductKind;
  version: number;
};

export function PresetsPageContent({
  rows,
  canCreate,
}: {
  rows: PresetRow[];
  canCreate: boolean;
}) {
  const [kind, setKind] = useState<StartReportKind>("dispanserization");
  const product = productOf(kind);
  const filtered = rows.filter((row) =>
    kind === "territory"
      ? row.kind === "territory" || row.kind === "okrug"
      : row.kind === kind,
  );

  return (
    <>
      <CreateReportSidebarSync kind={kind} onKindChange={setKind} />
      <header className="grid gap-2 border-b border-border pb-6">
        <p className="font-display text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          Форма отчёта
        </p>
        <h2 className="font-display text-2xl tracking-tight">
          {product.reportLabel}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          {kind === "dispanserization"
            ? "Список и создание отчётов по диспансеризации. Режим карты — в редакторе: Карта, шестиугольники, учреждения."
            : "Список и создание отчётов по инциденту №8. Режим карты — в редакторе: 9 районов, соты МО, 63 БУ."}
        </p>
      </header>

      {canCreate ? (
        <CreatePresetForm
          kind={kind}
          placeholder={
            kind === "dispanserization"
              ? "Диспансеризация, март 2026"
              : "Инцидент №8, март 2026"
          }
        />
      ) : null}

      <section className="grid gap-2" aria-label="Сохранённые отчёты">
        <h3 className="text-sm font-medium text-foreground">
          Сохранённые отчёты
        </h3>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Пока нет отчётов. Укажите название и создайте первый.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Нет отчётов формы «{reportKindLabel(kind)}». Создайте новый ниже.
          </p>
        ) : (
          filtered.map((row) => (
            <Link key={row.id} href={`/editor/${row.id}`} className="block">
              <Card className="flex-row items-center gap-4 py-4 shadow-none transition-colors hover:bg-accent/40">
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-6">
                  <strong className="truncate font-medium">{row.name}</strong>
                  <span className="flex shrink-0 items-center gap-3">
                    <Badge variant="secondary">
                      {reportKindLabel(row.kind)}
                    </Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      v{row.version}
                    </span>
                  </span>
                </div>
              </Card>
            </Link>
          ))
        )}
      </section>
    </>
  );
}
