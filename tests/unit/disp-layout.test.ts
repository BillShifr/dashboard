import { describe, expect, it } from "vitest";
import { CELLS, GEO, TILES } from "@/domain/disp/scene/layout";

describe("disp layout", () => {
  it("builds 22 tiles, 66 cells, 9 districts and 13 cities", () => {
    expect(TILES).toHaveLength(22);
    expect(CELLS).toHaveLength(66);
    expect(GEO.filter((g) => g.type === "district")).toHaveLength(9);
    expect(GEO.filter((g) => g.type === "city")).toHaveLength(13);
  });
});
