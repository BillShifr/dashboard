"use client";

import { useMemo, useState } from "react";
import { MapCanvas } from "@/components/editor/MapCanvas";
import styles from "@/components/editor/editor.module.css";
import { GROUPS, INSTITUTIONS } from "@/domain/disp/catalog";
import { parseInput } from "@/domain/disp/format";
import {
  facilityColor,
  groupColor,
  groupResult,
  totalResult,
} from "@/domain/disp/scene/colors";
import {
  buildDispPdfBlob,
  buildDispSvg,
  dispExportFilename,
  pngScene,
} from "@/domain/disp/scene/export";
import { mapShapes } from "@/domain/disp/scene/mapShapes";
import { PALETTES } from "@/domain/disp/style/palettes";
import type { DispanserizationPayload } from "@/domain/presets/schema";
import { downloadBlob, svgToPngBlob } from "@/domain/shared/png";
import { shapesToSvg } from "@/domain/shared/svg";

type Props = {
  presetId: string;
  payload: DispanserizationPayload;
  disabled: boolean;
  onChange: (next: DispanserizationPayload) => void;
  onServerPreset: (preset: {
    version: number;
    payload: DispanserizationPayload;
  }) => void;
  onSave: () => void;
  pending: boolean;
  status: string | null;
  version: number;
};

export function DispEditor({
  presetId,
  payload,
  disabled,
  onChange,
  onServerPreset,
  onSave,
  pending,
  status,
  version,
}: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string>(GROUPS[0]!.id);
  const [selectedFacility, setSelectedFacility] = useState<string>(
    INSTITUTIONS[0]!.id,
  );
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function restoreReference() {
    setImportBusy(true);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/presets/${presetId}/restore-reference`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ expectedVersion: version }),
        },
      );
      if (response.status === 409) {
        setNotice("Конфликт версии — обновите страницу");
        return;
      }
      if (!response.ok) {
        setNotice("Не удалось восстановить справочник");
        return;
      }
      const data = (await response.json()) as {
        preset: { version: number; payload: DispanserizationPayload };
      };
      onServerPreset(data.preset);
      setNotice("Справочные план/факт восстановлены");
    } finally {
      setImportBusy(false);
    }
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
        preset: { version: number; payload: DispanserizationPayload };
        imported: number;
      };
      onServerPreset(data.preset);
      setNotice(`Импортировано строк: ${data.imported}`);
    } finally {
      setImportBusy(false);
    }
  }

  const medical = payload.view === "med";
  const total = totalResult(payload);

  const svg = useMemo(
    () =>
      buildDispSvg(payload, true, {
        selectedGroup: medical ? null : selectedGroup,
        selectedFacility: medical ? selectedFacility : null,
        shapes: mapShapes(payload),
      }),
    [payload, medical, selectedGroup, selectedFacility],
  );

  const institutions = useMemo(() => {
    const q = query.toLocaleLowerCase("ru").replace(/ё/g, "е");
    return INSTITUTIONS.filter((f) => {
      if (payload.onlyPlanned) {
        const row = payload.records[f.id];
        if (row?.plan === null && row?.fact === null) return false;
      }
      return `${f.name} ${f.short} ${f.city} ${f.id}`
        .toLocaleLowerCase("ru")
        .replace(/ё/g, "е")
        .includes(q);
    });
  }, [query, payload.onlyPlanned, payload.records]);

  function patch(partial: Partial<DispanserizationPayload>) {
    onChange({ ...payload, ...partial });
  }

  function setRecord(
    id: string,
    next: Partial<{
      plan: number | null;
      fact: number | null;
      color: string | null;
    }>,
  ) {
    const current = payload.records[id] ?? {
      plan: null,
      fact: null,
      color: null,
    };
    patch({
      records: {
        ...payload.records,
        [id]: { ...current, ...next },
      },
    });
  }

  async function exportPng() {
    setExportBusy(true);
    setNotice(null);
    try {
      const scene = pngScene(payload);
      const markup = shapesToSvg(scene.shapes, scene.height);
      const blob = await svgToPngBlob(markup, 2160, scene.height * 4);
      downloadBlob(blob, dispExportFilename(payload, "png"));
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
        buildDispPdfBlob(payload),
        dispExportFilename(payload, "pdf"),
      );
      setNotice("PDF готов");
    } catch {
      setNotice("Не удалось создать PDF");
    } finally {
      setExportBusy(false);
    }
  }

  const selectedInst = INSTITUTIONS.find((f) => f.id === selectedFacility);
  const selectedGroupMeta = GROUPS.find((g) => g.id === selectedGroup);

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div>
          <p className={styles.muted} style={{ marginBottom: 4 }}>
            Диспансеризация
          </p>
          <strong>
            Итого{" "}
            {total.percent === null
              ? "—"
              : `${total.percent.toFixed(1).replace(".", ",")}%`}
          </strong>
        </div>
        <div className={styles.tabs} role="group" aria-label="Вид">
          {(["geo", "hex", "med"] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={payload.view === view}
              disabled={disabled}
              onClick={() => {
                patch({ view });
                setZoom(1);
              }}
            >
              {view === "geo"
                ? "Карта"
                : view === "hex"
                  ? "Шестиугольники"
                  : "Учреждения"}
            </button>
          ))}
        </div>
        <div className={styles.exports}>
          {!disabled && (
            <>
              <button
                type="button"
                className={styles.ghost}
                disabled={importBusy || pending}
                onClick={() => void restoreReference()}
              >
                Справочник Excel
              </button>
              <label
                className={styles.ghost}
                style={{ display: "inline-block", cursor: "pointer" }}
              >
                Импорт .xlsx
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  disabled={importBusy || pending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importExcel(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </>
          )}
          <button
            type="button"
            className={styles.ghost}
            disabled={exportBusy}
            onClick={exportPng}
          >
            PNG
          </button>
          <button
            type="button"
            className={styles.ghost}
            disabled={exportBusy}
            onClick={exportPdf}
          >
            PDF
          </button>
          {!disabled && (
            <button
              type="button"
              className={styles.primary}
              data-testid="save-preset"
              disabled={pending}
              onClick={onSave}
            >
              {pending ? "Сохранение…" : "Сохранить"}
            </button>
          )}
          <span className={styles.muted}>v{version}</span>
        </div>
      </div>

      <div className={styles.workspace}>
        <section className={styles.canvas}>
          <div className={styles.canvasHeader}>
            <span>
              {medical
                ? `${INSTITUTIONS.length} учреждений`
                : `${GROUPS.length} территории`}
            </span>
            <div className={styles.zoom}>
              <button
                type="button"
                disabled={zoom <= 1}
                onClick={() =>
                  setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))
                }
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                disabled={zoom >= 2.5}
                onClick={() =>
                  setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))
                }
              >
                +
              </button>
            </div>
          </div>
          <MapCanvas
            svg={svg}
            zoom={zoom}
            onSelectGroup={setSelectedGroup}
            onSelectFacility={(id) => {
              setSelectedFacility(id);
              const inst = INSTITUTIONS.find((f) => f.id === id);
              if (inst) setSelectedGroup(inst.group);
            }}
          />
        </section>

        <aside className={styles.side}>
          <label className={styles.field}>
            Поиск
            <input
              type="search"
              value={query}
              disabled={disabled}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className={styles.row}>
            <input
              type="checkbox"
              checked={payload.onlyPlanned}
              disabled={disabled}
              onChange={(e) => patch({ onlyPlanned: e.target.checked })}
            />
            Только с данными
          </label>

          {medical ? (
            <div className={styles.list}>
              {institutions.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={f.id === selectedFacility}
                  disabled={disabled}
                  onClick={() => {
                    setSelectedFacility(f.id);
                    setSelectedGroup(f.group);
                  }}
                >
                  <span
                    className={styles.dot}
                    style={{ background: facilityColor(payload, f.id) }}
                  />
                  <span>
                    <strong>{f.short}</strong>
                    <br />
                    <span className={styles.muted}>
                      {f.city} · {f.id}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.list}>
              {GROUPS.map((g) => {
                const r = groupResult(payload, g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={g.id === selectedGroup}
                    disabled={disabled}
                    onClick={() => setSelectedGroup(g.id)}
                  >
                    <span
                      className={styles.dot}
                      style={{ background: groupColor(payload, g.id) }}
                    />
                    <span>
                      <strong>{g.name}</strong>
                      <br />
                      <span className={styles.muted}>
                        {r.percent === null
                          ? "нет данных"
                          : `${r.percent.toFixed(1).replace(".", ",")}%`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <h2 style={{ margin: 0, fontSize: 18 }}>
            {medical ? selectedInst?.short : selectedGroupMeta?.name}
          </h2>

          {medical && selectedInst && (
            <>
              <label className={styles.field}>
                План
                <input
                  disabled={disabled}
                  defaultValue={
                    payload.records[selectedInst.id]?.plan === null ||
                    payload.records[selectedInst.id]?.plan === undefined
                      ? ""
                      : String(payload.records[selectedInst.id]?.plan)
                  }
                  key={`${selectedInst.id}-plan-${payload.records[selectedInst.id]?.plan}`}
                  onBlur={(e) => {
                    const parsed = parseInput(e.target.value);
                    if (!parsed.valid) {
                      setNotice("Некорректный план не сохранён");
                      return;
                    }
                    setRecord(selectedInst.id, {
                      plan: parsed.value,
                      color: null,
                    });
                  }}
                />
              </label>
              <label className={styles.field}>
                Факт
                <input
                  disabled={disabled}
                  defaultValue={
                    payload.records[selectedInst.id]?.fact === null ||
                    payload.records[selectedInst.id]?.fact === undefined
                      ? ""
                      : String(payload.records[selectedInst.id]?.fact)
                  }
                  key={`${selectedInst.id}-fact-${payload.records[selectedInst.id]?.fact}`}
                  onBlur={(e) => {
                    const parsed = parseInput(e.target.value);
                    if (!parsed.valid) {
                      setNotice("Некорректный факт не сохранён");
                      return;
                    }
                    setRecord(selectedInst.id, {
                      fact: parsed.value,
                      color: null,
                    });
                  }}
                />
              </label>
            </>
          )}

          {medical && (
            <label className={styles.field}>
              Основа карты
              <select
                value={payload.medicalBase}
                disabled={disabled}
                onChange={(e) =>
                  patch({
                    medicalBase: e.target
                      .value as DispanserizationPayload["medicalBase"],
                  })
                }
              >
                <option value="hex">Шестиугольники</option>
                <option value="geo">Карта</option>
              </select>
            </label>
          )}

          <label className={styles.field}>
            Палитра
            <select
              value={payload.palette}
              disabled={disabled}
              onChange={(e) =>
                patch({
                  palette: e.target.value as DispanserizationPayload["palette"],
                })
              }
            >
              {Object.entries(PALETTES).map(([id, palette]) => (
                <option key={id} value={id}>
                  {palette.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            Контур
            <input
              type="color"
              value={payload.outline}
              disabled={disabled}
              onChange={(e) => patch({ outline: e.target.value })}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.row}>
              <input
                type="checkbox"
                checked={payload.labels}
                disabled={disabled || medical}
                onChange={(e) => patch({ labels: e.target.checked })}
              />
              Подписи
            </label>
            <label className={styles.row}>
              <input
                type="checkbox"
                checked={payload.cityLabels}
                disabled={disabled || medical || payload.view !== "geo"}
                onChange={(e) => patch({ cityLabels: e.target.checked })}
              />
              Города
            </label>
            <label className={styles.row}>
              <input
                type="checkbox"
                checked={payload.showDetails}
                disabled={disabled}
                onChange={(e) => patch({ showDetails: e.target.checked })}
              />
              Детали в экспорте
            </label>
          </div>
        </aside>
      </div>
      {(status || notice) && (
        <p className={styles.status} role="status">
          {notice ?? status}
        </p>
      )}
    </div>
  );
}
