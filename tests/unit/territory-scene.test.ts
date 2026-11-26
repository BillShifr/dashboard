import { describe, expect, it } from "vitest";
import { defaultTerritoryPayload } from "@/domain/presets/defaults";
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

  it("draws every medical organization on the district map", () => {
    const { shapes, width, height } = scene(defaultTerritoryPayload());
    expect(width).toBe(960);
    expect(height).toBe(540);
    const ids = new Set(
      shapes.map((shape) => shape.facility).filter((id) => id != null),
    );
    expect(ids.size).toBe(71);
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

  it("uses the 16:9 slide for the incident map", () => {
    const dims = territoryPngDimensions(defaultTerritoryPayload());
    expect(dims.width).toBe(1920);
    expect(dims.height).toBe(1080);
    expect(dims.sceneHeight).toBe(540);
    const { shapes } = scene(defaultTerritoryPayload());
    expect(
      shapes.some(
        (shape) =>
          shape.label ===
          "средняя фактическая ЗП по категории за 9 месяцев 2026 года",
      ),
    ).toBe(true);
    expect(
      shapes.some((shape) => shape.image?.href === "/tfoms-logo.jpg"),
    ).toBe(true);
  });

  it("names incident views without the old object counts", () => {
    expect(INCIDENT_8_DISPLAY_VIEWS.map((view) => view.label)).toEqual([
      "Карта",
      "Соты",
    ]);
  });

  it("draws the same organizations on the marker map", () => {
    const { shapes } = scene({ ...defaultTerritoryPayload(), mode: "med" });
    const ids = new Set(
      shapes.map((shape) => shape.facility).filter((id) => id != null),
    );
    expect(ids.size).toBe(71);
  });
});
