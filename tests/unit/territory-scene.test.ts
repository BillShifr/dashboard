import { describe, expect, it } from "vitest";
import { defaultTerritoryPayload } from "@/domain/presets/defaults";
import { facilities } from "@/domain/territory/catalog/facilities.js";
import { NAMES } from "@/domain/territory/catalog/meta";
import { INCIDENT_8_DISPLAY_VIEWS } from "@/components/shell/report-display-views";
import { scene } from "@/domain/territory/scene/scene";
import {
  territoryExportFilename,
  territoryPngDimensions,
} from "@/domain/territory/scene/export";

describe("territory scene", () => {
  it("produces shapes for geo, hex and med modes", () => {
    for (const mode of ["geo", "hex", "med"] as const) {
      const state = { ...defaultTerritoryPayload(), mode };
      const { shapes, height } = scene(state);
      expect(shapes.length).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(
        shapes.every((s) => typeof s.d === "string" && s.d.length > 0),
      ).toBe(true);
    }
  });

  it("covers 9 regions", () => {
    expect(NAMES).toHaveLength(9);
    const { shapes } = scene(defaultTerritoryPayload());
    const regions = new Set(
      shapes.map((s) => s.group).filter((g): g is string => g != null),
    );
    expect(regions.size).toBe(9);
  });

  it("names exports like the HTML download helper", () => {
    const base = defaultTerritoryPayload();
    expect(territoryExportFilename(base, "png")).toBe("yugra-map.png");
    expect(territoryExportFilename({ ...base, mode: "hex" }, "pdf")).toBe(
      "yugra-hexagons.pdf",
    );
    expect(
      territoryExportFilename(
        { ...base, mode: "med", medicalBase: "geo" },
        "svg",
      ),
    ).toBe("yugra-medical-geo.svg");
    expect(
      territoryExportFilename(
        { ...base, mode: "med", medicalBase: "hex" },
        "png",
      ),
    ).toBe("yugra-medical-hex.png");
  });

  it("png dimensions are 2160 by sceneHeight*4", () => {
    const dims = territoryPngDimensions(defaultTerritoryPayload());
    expect(dims.width).toBe(2160);
    expect(dims.height).toBe(dims.sceneHeight * 4);
  });

  it("labels the medical view with the facility count", () => {
    const medical = INCIDENT_8_DISPLAY_VIEWS.find((view) => view.id === "med");
    expect(medical?.label).toBe(`${facilities.length} БУ`);
  });
});
