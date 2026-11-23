import type { WorkspaceItem } from "@/components/shell/constructor-context";
import {
  DISP_DISPLAY_VIEWS,
  INCIDENT_8_DISPLAY_VIEWS,
  type MapDisplayViewId,
} from "@/components/shell/report-display-views";

export function mapDisplaySidebarItems(
  product: "territory" | "dispanserization",
  active: MapDisplayViewId,
  onSelect: (id: MapDisplayViewId) => void,
  options?: { disabled?: boolean },
): WorkspaceItem[] {
  const views =
    product === "territory" ? INCIDENT_8_DISPLAY_VIEWS : DISP_DISPLAY_VIEWS;
  const disabled = options?.disabled ?? false;

  return views.map((v) => ({
    id: v.id,
    label: v.label,
    active: active === v.id,
    onSelect: () => {
      if (!disabled) onSelect(v.id);
    },
  }));
}
