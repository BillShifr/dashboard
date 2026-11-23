import { describe, expect, it } from "vitest";
import { OKRUG_LEGEND_EMU, orgHex } from "@/domain/okrug/catalog";
import { legendCounts, templateOf } from "@/domain/okrug/bands";
import { okrugScene } from "@/domain/okrug/scene/scene";
import { OKRUG_TEMPLATES } from "@/domain/okrug/templates";
import { defaultOkrugPayload } from "@/domain/presets/defaults";
import { EMU_PER_PT, polygonPath } from "@/domain/shared/geometry";

describe("okrug scene", () => {
  it("uses slide-1 MO geometry on every template", () => {
    for (const template of OKRUG_TEMPLATES) {
      const payload = defaultOkrugPayload(template.id);
      const { shapes } = okrugScene(payload);
      const refPath = polygonPath(orgHex("810001", 1).points);
      const orgShape = shapes.find(
        (s) => s.facility === "810001" && s.d === refPath,
      );
      expect(orgShape, template.id).toBeDefined();
    }
  });

  it("places legend captions to the right of swatches", () => {
    for (const template of OKRUG_TEMPLATES) {
      const payload = defaultOkrugPayload(template.id);
      const legendSlide = templateOf(payload).slide;
      const { shapes } = okrugScene(payload);
      const slots = OKRUG_LEGEND_EMU[legendSlide as 1 | 2 | 3 | 4 | 5 | 6 | 7];
      const legend = legendCounts(payload);
      slots.forEach((slot, index) => {
        const x = slot.x / EMU_PER_PT;
        const w = slot.w / EMU_PER_PT;
        const slotRight = x + w;
        const caption = legend[index]?.band.label;
        if (!caption) return;
        const captions = shapes.filter(
          (s) => s.label === caption && s.bbox && s.bbox[0]! > slotRight + 2,
        );
        expect(
          captions.length,
          `${template.id} legend ${index} «${caption}»`,
        ).toBeGreaterThan(0);
      });
    }
  });
});
