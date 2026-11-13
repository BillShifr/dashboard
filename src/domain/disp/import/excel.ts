import ExcelJS from "exceljs";
import { INSTITUTIONS } from "@/domain/disp/catalog";
import { validNumber } from "@/domain/disp/format";
import type { DispanserizationPayload } from "@/domain/presets/schema";

const SHEET_NAMES = ["ППЦ объемы", "ППЦ объёмы"];
const MAX_BYTES = 2_000_000;

type RecordEntry = DispanserizationPayload["records"][string];

function parseCellNumber(cell: ExcelJS.Cell): number | null {
  const raw = cell.value;
  if (raw === null || raw === undefined || raw === "") return null;
  let n: number;
  if (typeof raw === "number") n = raw;
  else if (typeof raw === "object" && raw !== null && "result" in raw)
    n = Number((raw as ExcelJS.CellFormulaValue).result);
  else n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!validNumber(n)) return null;
  return Math.round(n * 100) / 100;
}

function detectPlanFactColumns(sheet: ExcelJS.Worksheet): {
  planCol: number;
  factCol: number;
} {
  let planCol = 0;
  let factCol = 0;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 30) return;
    row.eachCell((cell, colNumber) => {
      const text = String(cell.text ?? "")
        .trim()
        .toLocaleLowerCase("ru");
      if (!planCol && text.includes("план")) planCol = colNumber;
      if (!factCol && text.includes("факт")) factCol = colNumber;
    });
  });
  return { planCol: planCol || 4, factCol: factCol || 5 };
}

function normalizeMoId(cell: ExcelJS.Cell): string | null {
  const text = String(cell.text ?? cell.value ?? "").trim();
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 6) return null;
  return digits;
}

export async function parsePpcVolumesWorkbook(
  data: Buffer | ArrayBuffer,
): Promise<Record<string, RecordEntry>> {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (bytes.byteLength > MAX_BYTES) throw new Error("Файл слишком большой");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    bytes as unknown as Parameters<ExcelJS.Xlsx["load"]>[0],
  );
  const sheet =
    SHEET_NAMES.map((name) => workbook.getWorksheet(name)).find(Boolean) ??
    workbook.worksheets.find((w) => /ппц/i.test(w.name)) ??
    workbook.worksheets[0];
  if (!sheet) throw new Error("Лист «ППЦ объемы» не найден");

  const known = new Set<string>(INSTITUTIONS.map((f) => f.id));
  const { planCol, factCol } = detectPlanFactColumns(sheet);
  const imported: Record<string, RecordEntry> = {};

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 2) return;
    const id = normalizeMoId(row.getCell(1));
    if (!id || !known.has(id)) return;
    imported[id] = {
      plan: parseCellNumber(row.getCell(planCol)),
      fact: parseCellNumber(row.getCell(factCol)),
      color: null,
    };
  });

  if (!Object.keys(imported).length)
    throw new Error("В файле нет распознанных кодов МО");

  return imported;
}

export function mergeImportedRecords(
  payload: DispanserizationPayload,
  imported: Record<string, RecordEntry>,
): DispanserizationPayload {
  const records = { ...payload.records };
  for (const [id, row] of Object.entries(imported)) {
    records[id] = row;
  }
  return { ...payload, records, groupColors: {} };
}
