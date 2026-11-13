"use client";

import styles from "./editor.module.css";

type Props = {
  svg: string;
  zoom: number;
  onSelectGroup?: (id: string) => void;
  onSelectFacility?: (id: string) => void;
};

export function MapCanvas({
  svg,
  zoom,
  onSelectGroup,
  onSelectFacility,
}: Props) {
  return (
    <div className={styles.mapScroll}>
      <div
        className={styles.map}
        style={{ width: `${zoom * 100}%` }}
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={(event) => {
          const target = event.target as Element;
          const facility = target.closest(
            "[data-facility]",
          ) as HTMLElement | null;
          const group = target.closest("[data-group]") as HTMLElement | null;
          if (facility?.dataset.facility) {
            onSelectFacility?.(facility.dataset.facility);
            return;
          }
          if (group?.dataset.group) onSelectGroup?.(group.dataset.group);
        }}
        onKeyDown={(event) => {
          if (!["Enter", " "].includes(event.key)) return;
          const target = event.target as Element;
          const facility = target.closest(
            "[data-facility]",
          ) as HTMLElement | null;
          const group = target.closest("[data-group]") as HTMLElement | null;
          if (!facility && !group) return;
          event.preventDefault();
          if (facility?.dataset.facility)
            onSelectFacility?.(facility.dataset.facility);
          else if (group?.dataset.group) onSelectGroup?.(group.dataset.group);
        }}
      />
    </div>
  );
}
