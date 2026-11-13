import { describe, expect, it } from "vitest";
import { defaultDispanserizationPayload } from "@/domain/presets/defaults";
import { legendShapes, mapShapes } from "@/domain/disp/scene/mapShapes";

describe("disp mapShapes", () => {
  it("returns path shapes for geo, hex and med views", () => {
    for (const view of ["geo", "hex", "med"] as const) {
      const state = { ...defaultDispanserizationPayload(), view };
      const shapes = mapShapes(state);
      expect(shapes.length).toBeGreaterThan(0);
      expect(
        shapes.every((s) => typeof s.d === "string" && s.d.length > 0),
      ).toBe(true);
    }
  });

  it("legend has 6 swatches", () => {
    const swatches = legendShapes(defaultDispanserizationPayload()).filter(
      (s) => !s.label,
    );
    expect(swatches).toHaveLength(6);
  });
});
