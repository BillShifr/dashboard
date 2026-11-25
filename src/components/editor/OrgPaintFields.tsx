"use client";

import { paintOf } from "@/domain/okrug/bands";
import { OKRUG_ORGS } from "@/domain/okrug/catalog";
import type { OkrugPayload } from "@/domain/presets/schema";
import styles from "./editor.module.css";

type Props = {
  payload: OkrugPayload;
  orgId: string;
  disabled: boolean;
  onChange: (next: OkrugPayload) => void;
};

export function OrgPaintFields({ payload, orgId, disabled, onChange }: Props) {
  const org = OKRUG_ORGS.find((item) => item.id === orgId);
  const paint = paintOf(payload, orgId);
  const custom = payload.extras.appearance?.[orgId];

  function setPaint(partial: { fill?: string | null; stroke?: string | null }) {
    const current = payload.extras.appearance?.[orgId] ?? {
      fill: null,
      stroke: null,
    };
    onChange({
      ...payload,
      extras: {
        ...payload.extras,
        appearance: {
          ...payload.extras.appearance,
          [orgId]: { ...current, ...partial },
        },
      },
    });
  }

  return (
    <>
      <p className={styles.muted}>
        {org ? `${org.label} · ${org.name}` : "Нажмите учреждение на карте"}
      </p>
      <label className={styles.field}>
        Цвет
        <input
          type="color"
          disabled={disabled || !org}
          value={custom?.fill || paint.fill}
          onChange={(event) => setPaint({ fill: event.target.value })}
        />
      </label>
      <label className={styles.field}>
        Граница
        <input
          type="color"
          disabled={disabled || !org}
          value={custom?.stroke || paint.stroke}
          onChange={(event) => setPaint({ stroke: event.target.value })}
        />
      </label>
      {(custom?.fill || custom?.stroke) && (
        <button
          type="button"
          className={styles.ghost}
          disabled={disabled}
          onClick={() => setPaint({ fill: null, stroke: null })}
        >
          Цвет по Excel
        </button>
      )}
    </>
  );
}
