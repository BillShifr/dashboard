import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parsePpcVolumesWorkbook } from "@/domain/disp/import/excel";
import { referenceDispRecords } from "@/domain/disp/import/reference";

async function buildSampleXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("ППЦ объемы");
  sheet.addRow(["Код МО", "", "Наименование", "План", "Факт"]);
  sheet.addRow(["810001", "", 'БУ "…"', 9000, 8000]);
  sheet.addRow(["810008", "", 'БУ "…"', 4000, 3000]);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

describe("disp excel import", () => {
  it("parses plan/fact by header row", async () => {
    const records = await parsePpcVolumesWorkbook(await buildSampleXlsx());
    expect(records["810001"]).toEqual({ plan: 9000, fact: 8000, color: null });
    expect(records["810008"]).toEqual({ plan: 4000, fact: 3000, color: null });
  });

  it("reference catalog has 66 institutions", () => {
    expect(Object.keys(referenceDispRecords())).toHaveLength(66);
  });
});
