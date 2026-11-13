import { describe, expect, it } from "vitest";
import {
  defaultDispanserizationPayload,
  defaultTerritoryPayload,
} from "@/domain/presets/defaults";
import { parsePresetPayload } from "@/domain/presets/schema";

describe("preset payload schemas", () => {
  it("accepts default territory payload", () => {
    expect(() =>
      parsePresetPayload("territory", defaultTerritoryPayload()),
    ).not.toThrow();
  });

  it("accepts default dispanserization payload", () => {
    expect(() =>
      parsePresetPayload("dispanserization", defaultDispanserizationPayload()),
    ).not.toThrow();
  });

  it("rejects wrong territory version", () => {
    expect(() =>
      parsePresetPayload("territory", {
        ...defaultTerritoryPayload(),
        version: 2,
      }),
    ).toThrow();
  });
});
