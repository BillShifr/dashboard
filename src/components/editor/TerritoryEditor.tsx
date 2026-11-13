"use client";

import { useMemo, useState } from "react";
import { MapCanvas } from "@/components/editor/MapCanvas";
import styles from "@/components/editor/editor.module.css";
import type { TerritoryPayload } from "@/domain/presets/schema";
import { downloadBlob, svgToPngBlob } from "@/domain/shared/png";
import { NAMES, PALETTE } from "@/domain/territory/catalog/meta";
import { facilities } from "@/domain/territory/catalog/facilities.js";
import {
  facilityColor,
  parseValue,
  scales,
} from "@/domain/territory/medical/scales.js";
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
  payload: TerritoryPayload;
  disabled: boolean;
  onChange: (next: TerritoryPayload) => void;
  onSave: () => void;
  pending: boolean;
  status: string | null;
  version: number;
};

export function TerritoryEditor({
  payload,
  disabled,
  onChange,
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
  const [notice, setNotice] = useState<string | null>(null);

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

  async function exportPng() {
    setExportBusy(true);
    setNotice(null);
    try {
      const dims = territoryPngDimensions(payload);
      const markup = buildTerritorySvg(payload, false);
      const blob = await svgToPngBlob(markup, dims.width, dims.height);
      downloadBlob(blob, territoryExportFilename(payload, "png"));
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
        buildTerritoryPdfBlob(payload),
        territoryExportFilename(payload, "pdf"),
      );
      setNotice("PDF готов");
    } catch {
      setNotice("Не удалось создать PDF");
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="group" aria-label="Вид схемы">
          {(["geo", "hex", "med"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={payload.mode === mode}
              disabled={disabled}
              onClick={() => {
                const medicalBase =
                  mode === "med" && payload.mode !== "med"
                    ? payload.mode === "hex"
                      ? "hex"
                      : "geo"
                    : payload.medicalBase;
                patch({ mode, medicalBase });
                setZoom(1);
              }}
            >
              {mode === "geo"
                ? "Карта"
                : mode === "hex"
                  ? "Шестиугольники"
                  : "Медучреждения"}
            </button>
          ))}
        </div>
        <div className={styles.exports}>
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
        <section className={styles.canvas} aria-label="Карта">
          <div className={styles.canvasHeader}>
            <span>{medical ? `${FACILITIES.length} БУ` : "9 районов"}</span>
            <div className={styles.zoom}>
              <button
                type="button"
                disabled={zoom <= 1}
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                disabled={zoom >= 3}
                onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
              >
                +
              </button>
            </div>
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

          {!medical && (
            <>
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
          )}
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
