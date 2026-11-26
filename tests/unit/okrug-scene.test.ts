import { describe, expect, it } from "vitest";
import { OKRUG_LEGEND_EMU, orgHex } from "@/domain/okrug/catalog";
import { legendCounts, templateOf } from "@/domain/okrug/bands";
import { okrugScene } from "@/domain/okrug/scene/scene";
import { OKRUG_TEMPLATES } from "@/domain/okrug/templates";
import { defaultOkrugPayload } from "@/domain/presets/defaults";
import {
  DEFAULT_NUMERATOR,
  DEFAULT_SUMMARY,
  SUMMARY_BOX,
  summaryPlacements,
} from "@/domain/okrug/slide-chrome";
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

  it("merges the summary title and the date headers", () => {
    const places = summaryPlacements(DEFAULT_SUMMARY);
    const title = places.find((place) => place.cell.text.startsWith("Топ МО"));
    expect(title?.h).toBeCloseTo(SUMMARY_BOX.h / 2);
    expect(places.some((place) => place.row === 4 && place.col === 0)).toBe(
      false,
    );
    const date = places.find((place) => place.row === 0 && place.col === 1);
    expect(date?.w).toBe(46 + 56);
    expect(places.some((place) => place.row === 0 && place.col === 2)).toBe(
      false,
    );
    const name = places.find((place) => place.row === 3 && place.col === 2);
    expect(name?.w).toBe(56 + 56 + 56);
  });

  it("prints the formula numerator on the exported slide", () => {
    const { shapes } = okrugScene(defaultOkrugPayload());
    expect(shapes.some((shape) => shape.label === DEFAULT_NUMERATOR)).toBe(
      true,
    );
    expect(
      shapes.some((shape) => shape.image?.href === "/tfoms-logo.jpg"),
    ).toBe(true);
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
