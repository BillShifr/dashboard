"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ExportMenu } from "@/components/editor/ExportMenu";
import { ImportFileButton } from "@/components/editor/ImportFileButton";
import { MapCanvas } from "@/components/editor/MapCanvas";
import { ZoomControl } from "@/components/editor/ZoomControl";
import styles from "@/components/editor/editor.module.css";
import { useConstructor } from "@/components/shell/constructor-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OKRUG_ORGS } from "@/domain/okrug/catalog";
import {
  fillFor,
  metricValue,
  okrugKpis,
  templateOf,
} from "@/domain/okrug/bands";
import {
  buildOkrugPdfBlob,
  buildOkrugSvg,
  okrugExportFilename,
  okrugPngDimensions,
} from "@/domain/okrug/scene/export";
import { okrugSlideSections } from "@/components/editor/okrug-slide-sections";
import type { OkrugPayload } from "@/domain/presets/schema";
import { downloadBlob, svgToPngBlob } from "@/domain/shared/png";

type Props = {
  presetId: string;
  payload: OkrugPayload;
  disabled: boolean;
  onChange: (next: OkrugPayload) => void;
  onServerPreset: (preset: { version: number; payload: OkrugPayload }) => void;
  onSave: () => void;
  pending: boolean;
  status: string | null;
  version: number;
  /** Если true — родитель сам рисует сайдбар (Инцидент №8: 9 районов / соты / 63 БУ). */
  manageSections?: boolean;
  /** Инцидент №8: кнопки экспорта держит родитель, они не зависят от вида карты. */
  ownToolbar?: boolean;
  inspectorExtra?: React.ReactNode;
};

function formatValue(value: number | null, unit: "%" | "мес."): string {
  if (value === null) return "—";
  const n = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: unit === "%" ? 2 : 3,
  }).format(value);
  return unit === "%" ? `${n}%` : n;
}

export function OkrugEditor({
  presetId,
  payload,
  disabled,
  onChange,
  onServerPreset,
  onSave,
  pending,
  status,
  version,
  manageSections = true,
  ownToolbar = true,
  inspectorExtra,
}: Props) {
  const [selected, setSelected] = useState(OKRUG_ORGS[0]!.id);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const template = templateOf(payload);
  const { setSections, setToolbar } = useConstructor();
  const onSaveRef = useRef(onSave);
  const onChangeRef = useRef(onChange);
  const importExcelRef = useRef<(file: File) => Promise<void>>(async () => {});
  const exportPngRef = useRef<() => Promise<void>>(async () => {});
  const exportPdfRef = useRef<() => void>(() => {});
  const kpi = useMemo(() => okrugKpis(payload), [payload]);
  const svg = useMemo(
    () => buildOkrugSvg(payload, true, selected),
    [payload, selected],
  );
  const selectedOrg =
    OKRUG_ORGS.find((o) => o.id === selected) ?? OKRUG_ORGS[0]!;
  const selectedValue = metricValue(payload, selectedOrg.id);

  const filtered = OKRUG_ORGS.filter((org) => {
    const q = query.trim().toLocaleLowerCase("ru");
    if (!q) return true;
    return `${org.id} ${org.label} ${org.name}`
      .toLocaleLowerCase("ru")
      .includes(q);
  });

  function patch(next: Partial<OkrugPayload>) {
    onChange({ ...payload, ...next });
  }

  function setMetricValue(id: string, raw: string) {
    const trimmed = raw.trim().replace(",", ".");
    const value = trimmed === "" ? null : Number(trimmed);
    if (value !== null && !Number.isFinite(value)) return;
    onChange({
      ...payload,
      records: {
        ...payload.records,
        [id]: {
          ...payload.records[id]!,
          [template.metric]: value,
        },
      },
    });
  }

  async function importExcel(file: File) {
    setImportBusy(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("expectedVersion", String(version));
      const response = await fetch(`/api/presets/${presetId}/import-excel`, {
        method: "POST",
        body: form,
      });
      if (response.status === 409) {
        setNotice("Конфликт версии — обновите страницу");
        return;
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setNotice(data?.error ?? "Импорт не удался");
        return;
      }
      const data = (await response.json()) as {
        preset: {
          version: number;
          payload: OkrugPayload | { okrug?: OkrugPayload };
        };
        imported: number;
        metric?: string;
      };
      const raw = data.preset.payload;
      const okrugPayload =
        raw && typeof raw === "object" && "okrug" in raw && raw.okrug
          ? raw.okrug
          : (raw as OkrugPayload);
      onServerPreset({ version: data.preset.version, payload: okrugPayload });
      setNotice(`Импортировано МО: ${data.imported}`);
    } finally {
      setImportBusy(false);
    }
  }

  async function exportPng() {
    setExportBusy(true);
    setNotice(null);
    try {
      const dims = okrugPngDimensions();
      const blob = await svgToPngBlob(
        buildOkrugSvg(payload, false),
        dims.width,
        dims.height,
      );
      downloadBlob(blob, okrugExportFilename(payload, "png"));
      setNotice("PNG готов");
    } catch {
      setNotice("Не удалось создать PNG");
    } finally {
      setExportBusy(false);
    }
  }

  function exportPdf() {
    setExportBusy(true);
    setNotice(null);
    try {
      downloadBlob(
        buildOkrugPdfBlob(payload),
        okrugExportFilename(payload, "pdf"),
      );
      setNotice("PDF готов");
    } catch {
      setNotice("Не удалось создать PDF");
    } finally {
      setExportBusy(false);
    }
  }

  useLayoutEffect(() => {
    if (!manageSections) return;
    setSections([
      {
        title: "Отображение",
        items: [
          {
            id: "hex",
            label: "Соты МО",
            active: true,
            onSelect: () => {},
          },
        ],
      },
      ...okrugSlideSections(
        payload,
        (next) => onChangeRef.current(next),
        disabled,
      ),
    ]);
  }, [payload, disabled, setSections, manageSections]);

  useEffect(() => {
    onSaveRef.current = onSave;
    onChangeRef.current = onChange;
    importExcelRef.current = importExcel;
    exportPngRef.current = exportPng;
    exportPdfRef.current = exportPdf;
  });

  useLayoutEffect(() => {
    if (!ownToolbar) return;
    setToolbar(
      <>
        <ImportFileButton
          disabled={disabled || importBusy}
          onFile={(file) => void importExcelRef.current(file)}
        />
        <ExportMenu
          busy={exportBusy}
          onPng={() => void exportPngRef.current()}
          onPdf={() => exportPdfRef.current()}
        />
        <Button
          type="button"
          size="sm"
          data-testid="save-preset"
          disabled={disabled || pending}
          onClick={() => onSaveRef.current()}
        >
          {pending ? "Сохранение…" : "Сохранить отчёт"}
        </Button>
      </>,
    );
  }, [disabled, importBusy, exportBusy, pending, setToolbar, ownToolbar]);

  return (
    <div className={styles.shell}>
      <section className={styles.canvas}>
        <div className={styles.canvasHeader}>
          <div className={styles.field} style={{ flex: 1 }}>
            <Label htmlFor="okrug-title">Заголовок слайда</Label>
            <Input
              id="okrug-title"
              value={payload.title}
              disabled={disabled}
              maxLength={240}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <ZoomControl
            zoom={zoom}
            min={0.6}
            max={1.8}
            step={0.1}
            onChange={setZoom}
          />
        </div>
        <MapCanvas svg={svg} zoom={zoom} onSelectFacility={setSelected} />
      </section>

      <aside className={styles.side}>
        <p className={styles.inspectorTitle}>Инспектор</p>
        <p className={styles.muted}>
          Значения из Excel «приложение к 1,4 / 2,5 / 3,6 / 7».
        </p>
        {template.showKpi && (
          <div className={styles.kpis}>
            <p>
              В диапазоне {kpi.inRange} · ниже {kpi.below} · выше {kpi.above}
            </p>
            <p>Доля МО вне диапазона: {kpi.outShare}%</p>
            <p>
              Среднее:{" "}
              {kpi.average === null ? "—" : `${kpi.average}${template.unit}`} по{" "}
              {kpi.filled} МО
            </p>
            <label className={styles.field}>
              Период
              <input
                value={payload.extras.period}
                disabled={disabled}
                placeholder="на 3 кв. 2026 года"
                onChange={(e) =>
                  patch({
                    extras: { ...payload.extras, period: e.target.value },
                  })
                }
              />
            </label>
            <label className={styles.field}>
              Целевой уровень ЗП
              <input
                value={payload.extras.targetSalary}
                disabled={disabled}
                placeholder="220 350 ₽"
                onChange={(e) =>
                  patch({
                    extras: {
                      ...payload.extras,
                      targetSalary: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label className={styles.field}>
              Фактический уровень ЗП
              <input
                value={payload.extras.factSalary}
                disabled={disabled}
                placeholder="216 290 ₽"
                onChange={(e) =>
                  patch({
                    extras: { ...payload.extras, factSalary: e.target.value },
                  })
                }
              />
            </label>
          </div>
        )}
        <label className={styles.field}>
          {selectedOrg.label}
          <span className={styles.muted}>{selectedOrg.name}</span>
          <input
            inputMode="decimal"
            disabled={disabled}
            value={selectedValue ?? ""}
            onChange={(e) => setMetricValue(selectedOrg.id, e.target.value)}
          />
        </label>
        <input
          type="search"
          placeholder="Поиск МО"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.list}>
          {filtered.map((org) => (
            <button
              key={org.id}
              type="button"
              aria-pressed={org.id === selected}
              onClick={() => setSelected(org.id)}
            >
              <span
                className={styles.dot}
                style={{ background: fillFor(payload, org.id) }}
              />
              <span>
                {org.label}
                <small className={styles.muted}>
                  {" "}
                  {formatValue(metricValue(payload, org.id), template.unit)}
                </small>
              </span>
            </button>
          ))}
        </div>
        {inspectorExtra}
        {(status || notice) && (
          <p className={styles.status} role="status">
            {notice ?? status}
          </p>
        )}
      </aside>
    </div>
  );
}
