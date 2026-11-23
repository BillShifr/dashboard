"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { ExportMenu } from "@/components/editor/ExportMenu";
import { ImportFileButton } from "@/components/editor/ImportFileButton";
import { MapCanvas } from "@/components/editor/MapCanvas";
import { ZoomControl } from "@/components/editor/ZoomControl";
import styles from "@/components/editor/editor.module.css";
import { OkrugEditor } from "@/components/editor/OkrugEditor";
import { okrugSlideSections } from "@/components/editor/okrug-slide-sections";
import { useConstructor } from "@/components/shell/constructor-context";
import { mapDisplaySidebarItems } from "@/components/shell/map-display-sidebar";
import type { MapDisplayViewId } from "@/components/shell/report-display-views";
import { defaultOkrugPayload } from "@/domain/presets/defaults";
import type { OkrugPayload, TerritoryPayload } from "@/domain/presets/schema";
import { Button } from "@/components/ui/button";
import { downloadBlob, svgToPngBlob } from "@/domain/shared/png";
import { NAMES, PALETTE } from "@/domain/territory/catalog/meta";
import { facilities } from "@/domain/territory/catalog/facilities.js";
import {
  facilityColor,
  parseValue,
  scales,
} from "@/domain/territory/medical/scales.js";
import {
  buildOkrugPdfBlob,
  buildOkrugSvg,
  okrugExportFilename,
  okrugPngDimensions,
} from "@/domain/okrug/scene/export";
import {
  buildTerritoryPdfBlob,
  buildTerritorySvg,
  territoryExportFilename,
  territoryPngDimensions,
} from "@/domain/territory/scene/export";

type Facility = {
  id: string;
  index: number;
  name: string;
  city: string;
};

const FACILITIES = facilities as Facility[];
const colorOf = facilityColor as (
  record: { value: number | null; manual: string | null },
  scale: string,
) => string;
const parse = parseValue as (text: string) => {
  valid: boolean;
  value: number | null;
};

type Props = {
  presetId: string;
  payload: TerritoryPayload;
  disabled: boolean;
  onChange: (next: TerritoryPayload) => void;
  onServerPreset: (preset: {
    version: number;
    payload: TerritoryPayload;
  }) => void;
  onSave: () => void;
  pending: boolean;
  status: string | null;
  version: number;
};

export function TerritoryEditor({
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
  const [selected, setSelected] = useState(0);
  const [selectedFacility, setSelectedFacility] = useState(FACILITIES[0]!.id);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { setSections, setToolbar } = useConstructor();

  const medical = payload.mode === "med";
  const active = medical
    ? (payload.records[selectedFacility] ?? { value: null, manual: null })
    : payload.items[selected]!;
  const activeFill = colorOf(
    {
      value: "value" in active ? active.value : null,
      manual:
        "manual" in active
          ? active.manual
          : ((active as { manual?: string | null }).manual ?? null),
    },
    payload.scale,
  );

  const svg = useMemo(
    () =>
      buildTerritorySvg(payload, true, {
        selectedGroup: medical ? null : String(selected),
        selectedFacility: medical ? selectedFacility : null,
      }),
    [payload, medical, selected, selectedFacility],
  );

  const facilityList = useMemo(() => {
    const q = query.toLocaleLowerCase("ru").replace(/ё/g, "е");
    return FACILITIES.filter((f) =>
      `${f.name} ${f.city} ${f.id}`
        .toLocaleLowerCase("ru")
        .replace(/ё/g, "е")
        .includes(q),
    );
  }, [query]);

  function patch(partial: Partial<TerritoryPayload>) {
    onChange({ ...payload, ...partial });
  }

  function setActiveManual(color: string | null) {
    if (medical) {
      patch({
        records: {
          ...payload.records,
          [selectedFacility]: {
            ...(payload.records[selectedFacility] ?? {
              value: null,
              manual: null,
            }),
            manual: color,
          },
        },
      });
      return;
    }
    const items = payload.items.map((item, i) =>
      i === selected
        ? { ...item, manual: color, color: color ?? item.color }
        : item,
    );
    patch({ items });
  }

  const honeycomb = payload.okrug ?? defaultOkrugPayload();
  const honeycombView = payload.mode === "hex";

  async function exportPng() {
    setExportBusy(true);
    setNotice(null);
    try {
      const dims = honeycombView
        ? okrugPngDimensions()
        : territoryPngDimensions(payload);
      const markup = honeycombView
        ? buildOkrugSvg(honeycomb, false)
        : buildTerritorySvg(payload, false);
      const blob = await svgToPngBlob(markup, dims.width, dims.height);
      downloadBlob(
        blob,
        honeycombView
          ? okrugExportFilename(honeycomb, "png")
          : territoryExportFilename(payload, "png"),
      );
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
        honeycombView
          ? buildOkrugPdfBlob(honeycomb)
          : buildTerritoryPdfBlob(payload),
        honeycombView
          ? okrugExportFilename(honeycomb, "pdf")
          : territoryExportFilename(payload, "pdf"),
      );
      setNotice("PDF готов");
    } catch {
      setNotice("Не удалось создать PDF");
    } finally {
      setExportBusy(false);
    }
  }

  const patchOkrug = useCallback(
    (next: OkrugPayload) => {
      onChange({ ...payload, okrug: next });
    },
    [onChange, payload],
  );

  const handleOkrugServerPreset = useCallback(
    (preset: { version: number; payload: OkrugPayload }) => {
      onServerPreset({
        version: preset.version,
        payload: {
          ...payload,
          okrug: preset.payload,
        },
      });
    },
    [onServerPreset, payload],
  );

  function setDisplayView(next: MapDisplayViewId) {
    if (next === "hex") {
      patch({
        mode: "hex",
        medicalBase: "geo",
        okrug: payload.okrug ?? honeycomb,
      });
      setZoom(1);
      return;
    }
    if (next === "med") {
      setMode("med");
      return;
    }
    setMode("geo");
  }

  function setMode(next: TerritoryPayload["mode"]) {
    const medicalBase =
      next === "med" && payload.mode !== "med" ? "geo" : payload.medicalBase;
    patch({ mode: next, medicalBase });
    setZoom(1);
  }

  useLayoutEffect(() => {
    const activeView: MapDisplayViewId =
      payload.mode === "med" ? "med" : payload.mode === "hex" ? "hex" : "geo";
    const display: {
      title: string;
      items: ReturnType<typeof mapDisplaySidebarItems>;
    }[] = [
      {
        title: "Отображение",
        items: mapDisplaySidebarItems("territory", activeView, setDisplayView, {
          disabled,
        }),
      },
    ];
    display.push(...okrugSlideSections(honeycomb, patchOkrug, disabled));
    setSections(display);
    // setDisplayView/patchOkrug recreate each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.mode, payload.okrug, payload.medicalBase, disabled, setSections]);

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
        preset: { version: number; payload: TerritoryPayload };
        imported: number;
      };
      onServerPreset(data.preset);
      setNotice(`Импортировано МО: ${data.imported}`);
    } finally {
      setImportBusy(false);
    }
  }

  useLayoutEffect(() => {
    setToolbar(
      <>
        <ImportFileButton
          accept=".xlsx,.xls"
          disabled={disabled || importBusy}
          onFile={(file) => void importExcel(file)}
        />
        <ExportMenu busy={exportBusy} onPng={exportPng} onPdf={exportPdf} />
        {!disabled && (
          <Button
            type="button"
            size="sm"
            data-testid="save-preset"
            disabled={pending}
            onClick={onSave}
          >
            {pending ? "Сохранение…" : "Сохранить отчёт"}
          </Button>
        )}
      </>,
    );
    // export handlers close over payload from this render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    disabled,
    importBusy,
    exportBusy,
    pending,
    setToolbar,
    onSave,
    honeycombView,
  ]);

  if (honeycombView) {
    return (
      <OkrugEditor
        presetId={presetId}
        payload={honeycomb}
        disabled={disabled}
        pending={pending}
        status={notice ?? status}
        version={version}
        manageSections={false}
        ownToolbar={false}
        inspectorExtra={
          <>
            <label className={styles.field}>
              Шкала
              <select
                value={payload.scale}
                disabled={disabled}
                onChange={(e) =>
                  patch({ scale: e.target.value as TerritoryPayload["scale"] })
                }
              >
                {Object.entries(scales as Record<string, { name: string }>).map(
                  ([id, scale]) => (
                    <option key={id} value={id}>
                      {scale.name}
                    </option>
                  ),
                )}
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
                  checked={payload.districts}
                  disabled={disabled}
                  onChange={(e) => patch({ districts: e.target.checked })}
                />
                Названия районов
              </label>
              <label className={styles.row}>
                <input
                  type="checkbox"
                  checked={payload.cities}
                  disabled={disabled}
                  onChange={(e) => patch({ cities: e.target.checked })}
                />
                Админцентры
              </label>
            </div>
          </>
        }
        onChange={patchOkrug}
        onServerPreset={handleOkrugServerPreset}
        onSave={onSave}
      />
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.canvas} aria-label="Карта">
        <div className={styles.canvasHeader}>
          <span>{medical ? `${FACILITIES.length} БУ` : "9 районов"}</span>
          <ZoomControl
            zoom={zoom}
            min={1}
            max={3}
            step={0.5}
            onChange={setZoom}
          />
        </div>
        <MapCanvas
          svg={svg}
          zoom={zoom}
          onSelectGroup={(id) => setSelected(Number(id))}
          onSelectFacility={(id) => {
            setSelectedFacility(id);
            if (!medical) patch({ mode: "med" });
          }}
        />
      </section>

      <aside className={styles.side}>
        <p className={styles.inspectorTitle}>Инспектор</p>
        {medical ? (
          <>
            <label className={styles.field}>
              Поиск учреждения
              <input
                type="search"
                value={query}
                disabled={disabled}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className={styles.list}>
              {facilityList.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={f.id === selectedFacility}
                  disabled={disabled}
                  onClick={() => setSelectedFacility(f.id)}
                >
                  <span
                    className={styles.dot}
                    style={{
                      background: colorOf(
                        payload.records[f.id] ?? {
                          value: null,
                          manual: null,
                        },
                        payload.scale,
                      ),
                    }}
                  />
                  <span>
                    <strong>
                      {f.index}. {f.name.replace(/^БУ /, "")}
                    </strong>
                    <br />
                    <span className={styles.muted}>
                      {f.city} · {f.id}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.list}>
            {NAMES.map((name, i) => {
              const fill = colorOf(payload.items[i]!, payload.scale);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected === i}
                  disabled={disabled}
                  onClick={() => setSelected(i)}
                  style={{ background: fill, color: "#213A2C" }}
                >
                  <span className={styles.dot} style={{ background: fill }} />
                  <span>
                    {i + 1}. {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <h2 style={{ margin: 0, fontSize: 18 }}>
          {medical
            ? FACILITIES.find((f) => f.id === selectedFacility)?.name.replace(
                /^БУ /,
                "",
              )
            : NAMES[selected]}
        </h2>

        {medical && (
          <label className={styles.field}>
            Основа
            <select
              value={payload.medicalBase}
              disabled={disabled}
              onChange={(e) =>
                patch({
                  medicalBase: e.target
                    .value as TerritoryPayload["medicalBase"],
                })
              }
            >
              <option value="geo">Карта</option>
              <option value="hex">Шестиугольники</option>
            </select>
          </label>
        )}

        <label className={styles.field}>
          Шкала
          <select
            value={payload.scale}
            disabled={disabled}
            onChange={(e) =>
              patch({ scale: e.target.value as TerritoryPayload["scale"] })
            }
          >
            {Object.entries(scales as Record<string, { name: string }>).map(
              ([id, scale]) => (
                <option key={id} value={id}>
                  {scale.name}
                </option>
              ),
            )}
          </select>
        </label>

        <label className={styles.field}>
          Значение, %
          <input
            value={
              ("value" in active ? active.value : null) === null
                ? ""
                : String(active.value).replace(".", ",")
            }
            disabled={disabled}
            onChange={(e) => {
              const parsed = parse(e.target.value);
              if (!parsed.valid) return;
              if (medical) {
                patch({
                  records: {
                    ...payload.records,
                    [selectedFacility]: {
                      value: parsed.value,
                      manual: null,
                    },
                  },
                });
              } else {
                const items = payload.items.map((item, i) =>
                  i === selected
                    ? { ...item, value: parsed.value, manual: null }
                    : item,
                );
                patch({ items });
              }
            }}
          />
        </label>

        <label className={styles.field}>
          Цвет
          <input
            type="color"
            value={activeFill}
            disabled={disabled}
            onChange={(e) => setActiveManual(e.target.value)}
          />
        </label>
        <div className={styles.swatches}>
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              disabled={disabled}
              style={{ background: color }}
              onClick={() => setActiveManual(color)}
            />
          ))}
        </div>
        {active.manual && (
          <button
            type="button"
            className={styles.ghost}
            disabled={disabled}
            onClick={() => setActiveManual(null)}
          >
            Авто по шкале
          </button>
        )}

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
              checked={payload.districts}
              disabled={disabled}
              onChange={(e) => patch({ districts: e.target.checked })}
            />
            Названия районов
          </label>
          <label className={styles.row}>
            <input
              type="checkbox"
              checked={payload.cities}
              disabled={disabled}
              onChange={(e) => patch({ cities: e.target.checked })}
            />
            Админцентры
          </label>
        </div>
        {(status || notice) && (
          <p className={styles.status} role="status">
            {notice ?? status}
          </p>
        )}
      </aside>
    </div>
  );
}
