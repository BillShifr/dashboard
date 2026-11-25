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

  it("keeps okrug honeycomb payload on incident-8 territory", () => {
    const parsed = parsePresetPayload("territory", defaultTerritoryPayload());
    expect(parsed).toMatchObject({ mode: "geo" });
    expect("okrug" in parsed && parsed.okrug?.templateId).toBe(
      "salary-doctors",
    );
  });

  it("accepts an older okrug extras object without slide chrome", () => {
    const legacy = defaultTerritoryPayload();
    legacy.okrug = {
      ...legacy.okrug!,
      extras: { period: "", targetSalary: "", factSalary: "" },
    };
    expect(() => parsePresetPayload("territory", legacy)).not.toThrow();
  });

  it("accepts legacy territory payload without okrug", () => {
    const legacy = { ...defaultTerritoryPayload() };
    delete legacy.okrug;
    expect(() => parsePresetPayload("territory", legacy)).not.toThrow();
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
