"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  reportKindLabel,
  type ProductKind,
} from "@/components/shell/product-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AdminReport = {
  id: string;
  name: string;
  kind: ProductKind;
  version: number;
  ownerUserId: string;
  ownerName: string;
  updatedAt: string;
};

export type OwnerOption = {
  id: string;
  fullName: string;
  login: string;
  isActive: boolean;
};

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return data?.error ?? "Не удалось сохранить";
}

export function ReportsPanel({
  reports,
  owners,
}: {
  reports: AdminReport[];
  owners: OwnerOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const activeOwners = owners.filter((owner) => owner.isActive);

  async function saveReport(id: string, formData: FormData) {
    setError(null);
    setPending(true);
    const response = await fetch(`/api/admin/presets/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        ownerUserId: formData.get("ownerUserId"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    router.refresh();
  }

  async function removeReport(id: string, name: string) {
    if (!window.confirm(`Удалить отчёт «${name}»?`)) return;
    setError(null);
    setPending(true);
    const response = await fetch(`/api/presets/${id}`, { method: "DELETE" });
    setPending(false);
    if (!response.ok) {
      setError(await readError(response));
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid max-w-6xl gap-4">
      <h2 className="text-lg font-semibold">Все отчёты</h2>
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Отчётов нет.</p>
      ) : (
        reports.map((report) => (
          <form
            key={report.id}
            action={(formData) => void saveReport(report.id, formData)}
            className="grid gap-3 border-b border-border pb-4 md:grid-cols-[1.4fr_10rem_1fr_auto_auto] md:items-end"
          >
            <div className="grid gap-2">
              <Label htmlFor={`${report.id}-name`}>Название</Label>
              <Input
                id={`${report.id}-name`}
                name="name"
                defaultValue={report.name}
                required
                maxLength={120}
              />
            </div>
            <p className="pb-2 text-sm text-muted-foreground">
              {reportKindLabel(report.kind)}
              <span className="mt-1 block text-xs tabular-nums">
                v{report.version} · {report.updatedAt}
              </span>
            </p>
            <div className="grid gap-2">
              <Label htmlFor={`${report.id}-owner`}>Владелец</Label>
              <select
                id={`${report.id}-owner`}
                name="ownerUserId"
                defaultValue={report.ownerUserId}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {activeOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName} ({owner.login})
                  </option>
                ))}
                {activeOwners.every(
                  (owner) => owner.id !== report.ownerUserId,
                ) ? (
                  <option value={report.ownerUserId}>
                    {report.ownerName} (отключён)
                  </option>
                ) : null}
              </select>
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              Сохранить
            </Button>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/editor/${report.id}`}>Открыть</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => void removeReport(report.id, report.name)}
              >
                Удалить
              </Button>
            </div>
          </form>
        ))
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
