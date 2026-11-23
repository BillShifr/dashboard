import { describe, expect, it } from "vitest";
import {
  OKRUG_LEGEND_EMU,
  OKRUG_ORGS,
  OKRUG_ORG_EMU,
  orgHex,
  type OkrugSlideNo,
} from "@/domain/okrug/catalog";
import { officeHexagon, officeHexagonFromEmu } from "@/domain/shared/geometry";

const SLIDES: OkrugSlideNo[] = [1, 2, 3, 4, 5, 6, 7];

describe("okrug hex geometry", () => {
  it("keeps 71 MO on every slide with PowerPoint hexagon vertices", () => {
    expect(OKRUG_ORGS).toHaveLength(71);
    for (const slide of SLIDES) {
      for (const org of OKRUG_ORGS) {
        const emu = OKRUG_ORG_EMU[slide][org.id];
        expect(emu).toHaveLength(4);
        const box = orgHex(org.id, slide);
        expect(box.points).toHaveLength(6);
        const expected = officeHexagonFromEmu(
          emu![0],
          emu![1],
          emu![2],
          emu![3],
        );
        box.points.forEach((point, i) => {
          expect(point[0]).toBeCloseTo(expected[i]![0], 8);
          expect(point[1]).toBeCloseTo(expected[i]![1], 8);
        });
      }
    }
  });

  it("copies Белоярская РБ box from slide 1 EMU", () => {
    const emu = OKRUG_ORG_EMU[1]["810001"];
    expect(emu).toEqual([3503712, 1844824, 504056, 504056]);
    const box = orgHex("810001", 1);
    expect(box.w).toBeCloseTo(504056 / 12700, 8);
    const formula = officeHexagon(box.x, box.y, box.w, box.h);
    box.points.forEach((point, i) => {
      expect(point[0]).toBeCloseTo(formula[i]![0], 8);
      expect(point[1]).toBeCloseTo(formula[i]![1], 8);
    });
  });

  it("places legend hexes from the pptx", () => {
    expect(OKRUG_LEGEND_EMU[1]).toHaveLength(4);
    expect(OKRUG_LEGEND_EMU[7]).toHaveLength(7);
    expect(OKRUG_LEGEND_EMU[1][0]?.color).toBe("#116348");
  });
});
