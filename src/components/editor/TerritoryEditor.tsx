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
import { OKRUG_ORGS } from "@/domain/okrug/catalog";
import { metricValue, templateOf } from "@/domain/okrug/bands";
import { OrgPaintFields } from "@/components/editor/OrgPaintFields";
import {
  SlideCellTools,
  SlideChromeFields,
} from "@/components/editor/SlideChromeFields";
import { defaultOkrugPayload } from "@/domain/presets/defaults";
import type { OkrugPayload, TerritoryPayload } from "@/domain/presets/schema";
import { Button } from "@/components/ui/button";
import { downloadBlob, svgToPngBlob } from "@/domain/shared/png";
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

function territoryMapPayload(payload: TerritoryPayload): TerritoryPayload {
  return payload.mode === "med" ? { ...payload, mode: "geo" } : payload;
}

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
  const [selectedOrg, setSelectedOrg] = useState(OKRUG_ORGS[0]!.id);
  const [summaryCell, setSummaryCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { setSections, setToolbar } = useConstructor();

  const viewMode = payload.mode === "hex" ? "hex" : "geo";
  const mapPayload = territoryMapPayload(payload);

  const svg = useMemo(
    () =>
      buildTerritorySvg(territoryMapPayload(payload), true, {
        selectedGroup: String(selected),
        selectedFacility: selectedOrg,
      }),
    [payload, selected, selectedOrg],
  );

  function patch(partial: Partial<TerritoryPayload>) {
    onChange({ ...payload, ...partial });
  }

  const honeycomb = payload.okrug ?? defaultOkrugPayload();
  const honeycombView = viewMode === "hex";

  async function exportPng() {
    setExportBusy(true);
    setNotice(null);
    try {
      const dims = honeycombView
        ? okrugPngDimensions()
        : territoryPngDimensions(mapPayload);
      const markup = honeycombView
        ? buildOkrugSvg(honeycomb, false)
        : buildTerritorySvg(mapPayload, false);
      const blob = await svgToPngBlob(markup, dims.width, dims.height);
      downloadBlob(
        blob,
        honeycombView
          ? okrugExportFilename(honeycomb, "png")
          : territoryExportFilename(mapPayload, "png"),
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
          : buildTerritoryPdfBlob(mapPayload),
        honeycombView
          ? okrugExportFilename(honeycomb, "pdf")
          : territoryExportFilename(mapPayload, "pdf"),
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
    setMode("geo");
  }

  function setMode(next: "geo" | "hex") {
    patch({ mode: next, medicalBase: "geo" });
    setZoom(1);
  }

  useLayoutEffect(() => {
    const activeView: MapDisplayViewId = viewMode;
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
      form.append("draft", JSON.stringify(payload));
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
            onClick={() => {
              setNotice(null);
              onSave();
            }}
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
          <ZoomControl
            zoom={zoom}
            min={0.6}
            max={1.8}
            step={0.1}
            onChange={setZoom}
          />
        </div>
        <MapCanvas
          svg={svg}
          zoom={zoom}
          onSelectGroup={(id) => setSelected(Number(id))}
          onSelectFacility={setSelectedOrg}
          overlay={
            <SlideChromeFields
              payload={honeycomb}
              disabled={disabled}
              onChange={patchOkrug}
              picked={summaryCell}
              onPick={setSummaryCell}
            />
          }
        />
      </section>

      <aside className={styles.side}>
        <p className={styles.inspectorTitle}>Инспектор</p>
        <SlideCellTools
          payload={honeycomb}
          disabled={disabled}
          onChange={patchOkrug}
          picked={summaryCell}
        />
        <p className={styles.muted}>
          {templateOf(honeycomb).shortName}:{" "}
          {metricValue(honeycomb, selectedOrg) === null
            ? "—"
            : String(metricValue(honeycomb, selectedOrg)).replace(".", ",")}
        </p>
        <OrgPaintFields
          payload={honeycomb}
          orgId={selectedOrg}
          disabled={disabled}
          onChange={patchOkrug}
        />

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
