"use client";

import { useState, useTransition } from "react";
import { DispEditor } from "@/components/editor/DispEditor";
import { TerritoryEditor } from "@/components/editor/TerritoryEditor";
import type {
  DispanserizationPayload,
  TerritoryPayload,
} from "@/domain/presets/schema";

type Kind = "territory" | "dispanserization";

type Props = {
  presetId: string;
  kind: Kind;
  version: number;
  payload: unknown;
  readOnly: boolean;
};

export function EditorShell({
  presetId,
  kind,
  version: initialVersion,
  payload: initialPayload,
  readOnly,
}: Props) {
  const [version, setVersion] = useState(initialVersion);
  const [payload, setPayload] = useState(initialPayload);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function save(nextPayload: unknown = payload) {
    setStatus(null);
    const response = await fetch(`/api/presets/${presetId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payload: nextPayload,
        expectedVersion: version,
      }),
    });
    if (response.status === 409) {
      setStatus("Конфликт версии — обновите страницу");
      return;
    }
    if (!response.ok) {
      setStatus("Сохранение не удалось");
      return;
    }
    const data = (await response.json()) as {
      preset: { version: number; payload: unknown };
    };
    startTransition(() => {
      setVersion(data.preset.version);
      setPayload(data.preset.payload);
      setStatus("Сохранено на сервере");
    });
  }

  if (kind === "territory") {
    return (
      <TerritoryEditor
        payload={payload as TerritoryPayload}
        disabled={readOnly || pending}
        version={version}
        pending={pending}
        status={status}
        onChange={setPayload}
        onSave={() => void save()}
      />
    );
  }

  return (
    <DispEditor
      presetId={presetId}
      payload={payload as DispanserizationPayload}
      disabled={readOnly || pending}
      version={version}
      pending={pending}
      status={status}
      onChange={(next) => setPayload(next)}
      onServerPreset={(preset) => {
        setVersion(preset.version);
        setPayload(preset.payload);
        setStatus("Сохранено на сервере");
      }}
      onSave={() => void save()}
    />
  );
}
