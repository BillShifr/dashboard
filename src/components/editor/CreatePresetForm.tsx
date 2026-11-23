"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  defaultDispanserizationPayload,
  defaultTerritoryPayload,
} from "@/domain/presets/defaults";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StartReportKind } from "@/components/shell/product-catalog";

export function CreatePresetForm({
  kind,
  placeholder,
}: {
  kind: StartReportKind;
  placeholder?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      setError("Укажите название");
      return;
    }
    const payload =
      kind === "dispanserization"
        ? defaultDispanserizationPayload()
        : defaultTerritoryPayload();

    const response = await fetch("/api/presets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, name, payload }),
    });
    if (!response.ok) {
      setError("Не удалось создать отчёт");
      return;
    }
    const data = (await response.json()) as { preset: { id: string } };
    startTransition(() => {
      router.push(`/editor/${data.preset.id}`);
      router.refresh();
    });
  }

  return (
    <Card className="py-5 shadow-none">
      <CardContent>
        <form
          action={onSubmit}
          className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"
        >
          <div className="grid gap-2">
            <Label htmlFor="preset-name">Название отчёта</Label>
            <Input
              id="preset-name"
              data-testid="preset-name"
              name="name"
              required
              maxLength={120}
              disabled={pending}
              placeholder={placeholder ?? "Март 2026"}
            />
          </div>
          <Button data-testid="create-preset" disabled={pending}>
            {pending ? "Создание…" : "Создать отчёт"}
          </Button>
          {error ? (
            <p role="alert" className="text-sm text-destructive md:col-span-2">
              {error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
