import type { WorkspaceSection } from "@/components/shell/constructor-context";
import { templateOf } from "@/domain/okrug/bands";
import { OKRUG_TEMPLATES } from "@/domain/okrug/templates";
import type { OkrugPayload } from "@/domain/presets/schema";

const GROUPS = [
  { id: "achievement", title: "Зарплата" },
  { id: "spread", title: "Разброс ЗП" },
  { id: "oms", title: "ОМС" },
] as const;

/** Слайды сот МО — как на утверждённом макете «шестиугольники». */
export function okrugSlideSections(
  payload: OkrugPayload,
  onChange: (next: OkrugPayload) => void,
  disabled: boolean,
): WorkspaceSection[] {
  return GROUPS.map((group) => ({
    title: group.title,
    items: OKRUG_TEMPLATES.filter((item) => item.group === group.id).map(
      (item) => ({
        id: item.id,
        index: String(item.slide),
        label: item.shortName,
        active: payload.templateId === item.id,
        onSelect: () => {
          if (disabled) return;
          const next = OKRUG_TEMPLATES.find((t) => t.id === item.id)!;
          const prev = templateOf(payload);
          const title =
            payload.title === prev.defaultTitle
              ? next.defaultTitle
              : payload.title;
          onChange({ ...payload, templateId: item.id, title });
        },
      }),
    ),
  }));
}
