import ExcelJS from "exceljs";
import { OKRUG_ORGS } from "@/domain/okrug/catalog";
import {
  OKRUG_TEMPLATE_BY_ID,
  type OkrugMetric,
} from "@/domain/okrug/templates";
import type { OkrugPayload } from "@/domain/presets/schema";

const MAX_BYTES = 2_000_000;
const LABEL_BY_NORM = new Map(
  OKRUG_ORGS.map((org) => [normalizeLabel(org.label), org.id]),
);

export type OkrugImportResult = {
  metric: OkrugMetric;
  values: Record<string, number | null>;
};

function cellText(cell: ExcelJS.Cell): string {
  const raw = cell.value;
  if (raw === null || raw === undefined) return cell.text ?? "";
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    if ("text" in raw && typeof raw.text === "string") return raw.text;
    if ("richText" in raw && Array.isArray(raw.richText))
      return raw.richText.map((p) => p.text).join("");
    if ("result" in raw) return String(raw.result ?? "");
  }
  return String(cell.text ?? "");
}

function normalizeLabel(s: string): string {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseNumber(cell: ExcelJS.Cell): number | null {
  const raw = cell.value;
  if (raw === null || raw === undefined || raw === "") return null;
  let n: number;
  if (typeof raw === "number") n = raw;
  else if (typeof raw === "object" && raw !== null && "result" in raw)
    n = Number((raw as ExcelJS.CellFormulaValue).result);
  else n = Number(String(cellText(cell)).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return null;
  return n;
}

function orgIdFromName(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 6 && OKRUG_ORGS.some((o) => o.id === digits))
    return digits;
  if (/мсч/i.test(text)) return "810156";
  const label = LABEL_BY_NORM.get(normalizeLabel(text));
  return label ?? null;
}

function detectMetric(sheet: ExcelJS.Worksheet): OkrugMetric {
  let blob = "";
  sheet.eachRow({ includeEmpty: false }, (row, n) => {
    if (n > 6) return;
    row.eachCell((cell) => {
      blob += ` ${cellText(cell)}`;
    });
  });
  const t = blob.toLocaleLowerCase("ru");
  if (t.includes("остат") || t.includes("ежмесяч") || t.includes("ежемесяч"))
    return "oms";
  if (t.includes("младш")) return "junior";
  if (t.includes("средн")) return "mid";
  if (t.includes("врач") || t.includes("фармац")) return "doctors";
  return "doctors";
}

function detectColumns(sheet: ExcelJS.Worksheet): {
  nameCol: number;
  labelCol: number;
  valueCol: number;
} {
  let nameCol = 0;
  let labelCol = 0;
  let valueCol = 0;
  sheet.eachRow((row, n) => {
    if (n > 6) return;
    row.eachCell((cell, col) => {
      const t = cellText(cell).toLocaleLowerCase("ru");
      if (
        !nameCol &&
        t.includes("наименование медицинской организации") &&
        !t.includes("слайд")
      )
        nameCol = col;
      if (!labelCol && t.includes("на слайде")) labelCol = col;
      if (
        !valueCol &&
        (t.includes("фактическое") ||
          t.includes("выполнен") ||
          t.includes("остат") ||
          t.includes("ежмесяч") ||
          t.includes("ежемесяч"))
      )
        valueCol = col;
    });
  });
  return {
    nameCol: nameCol || 1,
    labelCol: labelCol || 2,
    valueCol: valueCol || 3,
  };
}

export async function parseOkrugWorkbook(
  data: Buffer | ArrayBuffer,
): Promise<OkrugImportResult> {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (bytes.byteLength > MAX_BYTES) throw new Error("Файл слишком большой");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    bytes as unknown as Parameters<ExcelJS.Xlsx["load"]>[0],
  );
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("В книге нет листов");

  const metric = detectMetric(sheet);
  const { nameCol, labelCol, valueCol } = detectColumns(sheet);
  const values: Record<string, number | null> = {};

  sheet.eachRow((row, n) => {
    if (n < 5) return;
    const id =
      orgIdFromName(cellText(row.getCell(nameCol))) ??
      orgIdFromName(cellText(row.getCell(labelCol)));
    if (!id) return;
    values[id] = parseNumber(row.getCell(valueCol));
  });

  if (!Object.keys(values).length)
    throw new Error("В файле нет распознанных кодов МО");
  return { metric, values };
}

export function mergeOkrugImport(
  payload: OkrugPayload,
  imported: OkrugImportResult,
): OkrugPayload {
  const records = { ...payload.records };
  for (const org of OKRUG_ORGS) {
    if (!(org.id in imported.values)) continue;
    records[org.id] = {
      ...records[org.id],
      [imported.metric]: imported.values[org.id] ?? null,
    };
  }
  const templateId =
    imported.metric === "oms"
      ? "oms-residuals"
      : imported.metric === "junior"
        ? payload.templateId.includes("spread")
          ? "spread-junior"
          : "salary-junior"
        : imported.metric === "mid"
          ? payload.templateId.includes("spread")
            ? "spread-mid"
            : "salary-mid"
          : payload.templateId.includes("spread")
            ? "spread-doctors"
            : "salary-doctors";
  const prev = OKRUG_TEMPLATE_BY_ID[payload.templateId];
  const next = OKRUG_TEMPLATE_BY_ID[templateId];
  const title =
    payload.title === prev.defaultTitle ? next.defaultTitle : payload.title;
  return { ...payload, templateId, title, records };
}
