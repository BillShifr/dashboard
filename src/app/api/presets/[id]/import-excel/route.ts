import { z } from "zod";
import {
  mergeImportedRecords,
  parsePpcVolumesWorkbook,
} from "@/domain/disp/import/excel";
import {
  mergeOkrugImport,
  parseOkrugWorkbook,
} from "@/domain/okrug/import/excel";
import { defaultOkrugPayload } from "@/domain/presets/defaults";
import {
  okrugPayloadSchema,
  territoryPayloadSchema,
  type DispanserizationPayload,
  type OkrugPayload,
  type TerritoryPayload,
} from "@/domain/presets/schema";
import { getPreset, updatePreset } from "@/domain/presets/service";
import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

function readDraft<T>(
  value: FormDataEntryValue | null,
  schema: z.ZodType<T>,
): T | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role === "viewer") return jsonError("Forbidden", 403);

  const form = await request.formData();
  const file = form.get("file");
  const expectedVersion = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(form.get("expectedVersion"));
  if (!expectedVersion.success) return jsonError("Validation failed", 400);
  if (!(file instanceof File)) return jsonError("Файл не выбран", 400);

  const { id } = await params;
  const preset = await getPreset(user, id);
  if (!preset) return jsonError("Not found", 404);
  if (
    preset.kind !== "dispanserization" &&
    preset.kind !== "okrug" &&
    preset.kind !== "territory"
  )
    return jsonError(
      "Импорт Excel только для диспансеризации и Инцидента №8",
      400,
    );

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (preset.kind === "okrug" || preset.kind === "territory") {
      const imported = await parseOkrugWorkbook(buffer);
      if (preset.kind === "territory") {
        const current =
          readDraft(form.get("draft"), territoryPayloadSchema) ??
          (preset.payload as TerritoryPayload);
        const nextPayload: TerritoryPayload = {
          ...current,
          okrug: mergeOkrugImport(
            current.okrug ?? defaultOkrugPayload(),
            imported,
          ),
        };
        const row = await updatePreset(user, id, {
          expectedVersion: expectedVersion.data,
          payload: nextPayload,
        });
        return Response.json({
          preset: row,
          imported: Object.keys(imported.values).length,
          metric: imported.metric,
        });
      }
      const nextPayload = mergeOkrugImport(
        readDraft(form.get("draft"), okrugPayloadSchema) ??
          (preset.payload as OkrugPayload),
        imported,
      );
      const row = await updatePreset(user, id, {
        expectedVersion: expectedVersion.data,
        payload: nextPayload,
      });
      return Response.json({
        preset: row,
        imported: Object.keys(imported.values).length,
        metric: imported.metric,
      });
    }
    const imported = await parsePpcVolumesWorkbook(buffer);
    const nextPayload = mergeImportedRecords(
      preset.payload as DispanserizationPayload,
      imported,
    );
    const row = await updatePreset(user, id, {
      expectedVersion: expectedVersion.data,
      payload: nextPayload,
    });
    return Response.json({
      preset: row,
      imported: Object.keys(imported).length,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VERSION_CONFLICT")
        return jsonError("Version conflict", 409);
      if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
