import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { legendCounts } from "@/domain/okrug/bands";
import {
  parseOkrugWorkbook,
  mergeOkrugImport,
} from "@/domain/okrug/import/excel";
import { defaultOkrugPayload } from "@/domain/presets/defaults";
import { parsePresetPayload } from "@/domain/presets/schema";

const fixtures = path.join(process.cwd(), "tests/fixtures/okrug");

async function load(name: string) {
  return readFile(path.join(fixtures, name));
}

describe("okrug excel import", () => {
  it("accepts default okrug payload", () => {
    expect(() =>
      parsePresetPayload("okrug", defaultOkrugPayload()),
    ).not.toThrow();
  });

  it("keeps a manual fill and stroke when excel replaces the metric", async () => {
    const imported = await parseOkrugWorkbook(
      await load("salary-doctors.xlsx"),
    );
    const painted = defaultOkrugPayload();
    painted.extras.appearance = {
      "810001": { fill: "#112233", stroke: "#445566" },
    };
    const payload = mergeOkrugImport(painted, imported);
    expect(payload.extras.appearance?.["810001"]).toEqual({
      fill: "#112233",
      stroke: "#445566",
    });
    expect(payload.records["810001"]?.doctors).not.toBeNull();
  });

  it("colors doctors achievement as on slide 1", async () => {
    const imported = await parseOkrugWorkbook(
      await load("salary-doctors.xlsx"),
    );
    expect(imported.metric).toBe("doctors");
    expect(Object.keys(imported.values)).toHaveLength(71);
    const payload = mergeOkrugImport(defaultOkrugPayload(), imported);
    const counts = Object.fromEntries(
      legendCounts(payload).map((item) => [item.band.id, item.count]),
    );
    expect(counts).toMatchObject({ ok: 25, y190: 10, y180: 9, low: 27 });
  });

  it("colors mid-level staff as on slide 2", async () => {
    const imported = await parseOkrugWorkbook(await load("salary-mid.xlsx"));
    expect(imported.metric).toBe("mid");
    const payload = mergeOkrugImport(
      defaultOkrugPayload("salary-mid"),
      imported,
    );
    const counts = Object.fromEntries(
      legendCounts(payload).map((item) => [item.band.id, item.count]),
    );
    expect(counts).toMatchObject({ ok: 38, y90: 23, y80: 10, low: 0 });
  });

  it("treats junior zeros as not participating", async () => {
    const imported = await parseOkrugWorkbook(await load("salary-junior.xlsx"));
    expect(imported.metric).toBe("junior");
    const payload = mergeOkrugImport(
      defaultOkrugPayload("salary-junior"),
      imported,
    );
    const counts = Object.fromEntries(
      legendCounts(payload).map((item) => [item.band.id, item.count]),
    );
    expect(counts).toMatchObject({ ok: 11, y90: 8, y80: 12, low: 2, none: 38 });
  });

  it("parses OMS residuals workbook", async () => {
    const imported = await parseOkrugWorkbook(await load("oms.xlsx"));
    expect(imported.metric).toBe("oms");
    const payload = mergeOkrugImport(
      defaultOkrugPayload("oms-residuals"),
      imported,
    );
    const counts = Object.fromEntries(
      legendCounts(payload).map((item) => [item.band.id, item.count]),
    );
    expect(counts.a).toBe(34);
    expect(counts.zero).toBe(1);
    expect(counts.f).toBe(1);
  });
});
