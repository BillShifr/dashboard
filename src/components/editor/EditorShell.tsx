"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { DispEditor } from "@/components/editor/DispEditor";
import { OkrugEditor } from "@/components/editor/OkrugEditor";
import { TerritoryEditor } from "@/components/editor/TerritoryEditor";
import type {
  DispanserizationPayload,
  OkrugPayload,
  TerritoryPayload,
} from "@/domain/presets/schema";

type Kind = "territory" | "dispanserization" | "okrug";

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
  const payloadRef = useRef(payload);
  const versionRef = useRef(version);
  useEffect(() => {
    payloadRef.current = payload;
    versionRef.current = version;
  });

  const applyServerPreset = useCallback(
    (preset: { version: number; payload: unknown }) => {
      setVersion(preset.version);
      setPayload(preset.payload);
      setStatus("Сохранено на сервере");
    },
    [],
  );

  const save = useCallback(
    async (nextPayload: unknown = payloadRef.current) => {
      setStatus(null);
      const response = await fetch(`/api/presets/${presetId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payload: nextPayload,
          expectedVersion: versionRef.current,
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
    },
    [presetId, startTransition],
  );

  const onSave = useCallback(() => {
    void save();
  }, [save]);

  if (kind === "okrug") {
    return (
      <OkrugEditor
        presetId={presetId}
        payload={payload as OkrugPayload}
        disabled={readOnly || pending}
        version={version}
        pending={pending}
        status={status}
        onChange={setPayload as (next: OkrugPayload) => void}
        onServerPreset={
          applyServerPreset as (preset: {
            version: number;
            payload: OkrugPayload;
          }) => void
        }
        onSave={onSave}
      />
    );
  }

  if (kind === "territory") {
    return (
      <TerritoryEditor
        presetId={presetId}
        payload={payload as TerritoryPayload}
        disabled={readOnly || pending}
        version={version}
        pending={pending}
        status={status}
        onChange={setPayload as (next: TerritoryPayload) => void}
        onServerPreset={
          applyServerPreset as (preset: {
            version: number;
            payload: TerritoryPayload;
          }) => void
        }
        onSave={onSave}
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
      onChange={setPayload as (next: DispanserizationPayload) => void}
      onServerPreset={
        applyServerPreset as (preset: {
          version: number;
          payload: DispanserizationPayload;
        }) => void
      }
      onSave={onSave}
    />
  );
}
