"use client";

import type { CSSProperties, ChangeEvent } from "react";
import {
  DEFAULT_DENOMINATOR,
  DEFAULT_NUMERATOR,
  DEFAULT_SUMMARY,
  SLIDE_LOGO,
  summaryPlacements,
  wrapSlideText,
  type SlideCell,
} from "@/domain/okrug/slide-chrome";
import type { OkrugPayload } from "@/domain/presets/schema";
import styles from "./editor.module.css";

type Props = {
  payload: OkrugPayload;
  disabled: boolean;
  onChange: (next: OkrugPayload) => void;
};

export function SlideChromeFields({
  payload,
  disabled,
  onChange,
  picked,
  onPick,
}: Props & {
  picked: { row: number; col: number } | null;
  onPick: (cell: { row: number; col: number } | null) => void;
}) {
  const summary = payload.extras.summary?.length
    ? payload.extras.summary
    : DEFAULT_SUMMARY;
  const placements = summaryPlacements(summary);

  function patchExtras(partial: Partial<OkrugPayload["extras"]>) {
    onChange({ ...payload, extras: { ...payload.extras, ...partial } });
  }

  function patchCell(row: number, col: number, partial: Partial<SlideCell>) {
    const next = summary.map((line) => line.map((item) => ({ ...item })));
    const current = next[row]?.[col];
    if (!current) return;
    next[row]![col] = { ...current, ...partial };
    patchExtras({ summary: next });
  }

  return (
    <div className={styles.slideOverlay}>
      {/* JPEG from the PowerPoint slide; next/image does not fit the overlay coords. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.slideLogo}
        src={SLIDE_LOGO.href}
        alt="ТФОМС Югры"
        width={SLIDE_LOGO.w}
        height={SLIDE_LOGO.h}
        style={box(SLIDE_LOGO.x, SLIDE_LOGO.y, SLIDE_LOGO.w, SLIDE_LOGO.h)}
      />
      <textarea
        className={styles.slideTitle}
        style={box(8, 8, 800, 56)}
        disabled={disabled}
        value={payload.title}
        maxLength={240}
        aria-label="Заголовок слайда"
        onChange={(event) =>
          onChange({ ...payload, title: event.target.value })
        }
      />
      <textarea
        className={styles.slideFormula}
        style={box(28, 78, 440, 16)}
        disabled={disabled}
        value={payload.extras.numerator ?? DEFAULT_NUMERATOR}
        maxLength={300}
        aria-label="Числитель"
        onChange={(event) => patchExtras({ numerator: event.target.value })}
      />
      <textarea
        className={styles.slideFormula}
        style={box(28, 100, 440, 16)}
        disabled={disabled}
        value={payload.extras.denominator ?? DEFAULT_DENOMINATOR}
        maxLength={300}
        aria-label="Знаменатель"
        onChange={(event) => patchExtras({ denominator: event.target.value })}
      />
      {placements.map((place) => {
        const item = place.cell;
        const merged = (item.rowSpan ?? 1) > 1;
        const lines = wrapSlideText(item.text, item.size, place.w - 8);
        const pad = Math.max(1, (place.h - lines.length * item.size * 1.2) / 2);
        const style: CSSProperties = {
          ...box(place.x + 1, place.y + 1, place.w - 2, place.h - 2),
          color: item.color,
          background: item.fill,
          fontWeight: item.bold ? 700 : 400,
          fontSize: `calc(${item.size} * 100cqw / 960)`,
          textAlign: place.align,
          paddingTop: merged ? `calc(${pad} * 100cqh / 540)` : undefined,
          outline:
            picked?.row === place.row && picked.col === place.col
              ? "1px solid #2F5496"
              : "none",
        };
        const fieldProps = {
          className: styles.slideCell,
          style,
          disabled,
          value: item.text,
          maxLength: 160,
          "aria-label": `Клетка ${place.row + 1}.${place.col + 1}`,
          "data-summary-cell": true,
          onFocus: () => onPick({ row: place.row, col: place.col }),
          onBlur: () => {
            window.setTimeout(() => {
              const active = document.activeElement;
              if (
                active instanceof Element &&
                active.closest("[data-summary-cell], [data-summary-tools]")
              ) {
                return;
              }
              onPick(null);
            }, 0);
          },
          onChange: (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => patchCell(place.row, place.col, { text: event.target.value }),
        };
        return merged ? (
          <textarea key={`${place.row}-${place.col}`} {...fieldProps} />
        ) : (
          <input key={`${place.row}-${place.col}`} {...fieldProps} />
        );
      })}
    </div>
  );
}

export function SlideCellTools({
  payload,
  disabled,
  onChange,
  picked,
}: Props & { picked: { row: number; col: number } | null }) {
  const summary = payload.extras.summary?.length
    ? payload.extras.summary
    : DEFAULT_SUMMARY;
  const active = picked ? summary[picked.row]?.[picked.col] : undefined;
  if (!picked || !active) return null;
  const row = picked.row;
  const col = picked.col;

  function patchCell(partial: Partial<SlideCell>) {
    const next = summary.map((line) => line.map((item) => ({ ...item })));
    const current = next[row]?.[col];
    if (!current) return;
    next[row]![col] = { ...current, ...partial };
    onChange({
      ...payload,
      extras: { ...payload.extras, summary: next },
    });
  }

  return (
    <div
      className={styles.slideTools}
      data-summary-tools
      onMouseDown={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) return;
        event.preventDefault();
      }}
    >
      <p className={styles.inspectorTitle}>Клетка сводки</p>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={active.bold}
        aria-label="Жирный"
        onClick={() => patchCell({ bold: !active.bold })}
      >
        Ж
      </button>
      <label>
        Размер
        <input
          type="number"
          min={8}
          max={28}
          disabled={disabled}
          value={active.size}
          onChange={(event) =>
            patchCell({ size: Number(event.target.value) || active.size })
          }
        />
      </label>
      <label>
        Текст
        <input
          type="color"
          disabled={disabled}
          value={active.color}
          aria-label="Цвет текста"
          onChange={(event) => patchCell({ color: event.target.value })}
        />
      </label>
      <label>
        Клетка
        <input
          type="color"
          disabled={disabled}
          value={active.fill}
          aria-label="Цвет клетки"
          onChange={(event) => patchCell({ fill: event.target.value })}
        />
      </label>
    </div>
  );
}

function box(x: number, y: number, w: number, h: number): CSSProperties {
  return {
    left: `calc(${x} * 100cqw / 960)`,
    top: `calc(${y} * 100cqh / 540)`,
    width: `calc(${w} * 100cqw / 960)`,
    height: `calc(${h} * 100cqh / 540)`,
  };
}
