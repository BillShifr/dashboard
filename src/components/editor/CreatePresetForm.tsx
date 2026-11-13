"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  defaultDispanserizationPayload,
  defaultTerritoryPayload,
} from "@/domain/presets/defaults";

export function CreatePresetForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const kind = String(formData.get("kind"));
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
      setError("Не удалось создать пресет");
      return;
    }
    const data = (await response.json()) as { preset: { id: string } };
    startTransition(() => {
      router.push(`/editor/${data.preset.id}`);
      router.refresh();
    });
  }

  return (
    <form
      action={onSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr auto",
        gap: 10,
        alignItems: "end",
        padding: 16,
        background: "#fff",
        border: "1px solid var(--line)",
      }}
    >
      <label style={{ display: "grid", gap: 6 }}>
        Название
        <input
          data-testid="preset-name"
          name="name"
          required
          maxLength={120}
          disabled={pending}
        />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Тип
        <select name="kind" defaultValue="territory" disabled={pending}>
          <option value="territory">Территории</option>
          <option value="dispanserization">Диспансеризация</option>
        </select>
      </label>
      <button
        data-testid="create-preset"
        disabled={pending}
        style={{
          padding: "10px 14px",
          border: 0,
          background: "var(--accent)",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        {pending ? "Создание…" : "Создать"}
      </button>
      {error && (
        <p
          role="alert"
          style={{ gridColumn: "1 / -1", color: "var(--danger)", margin: 0 }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
