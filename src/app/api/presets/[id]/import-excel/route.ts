import { z } from "zod";
import {
  mergeImportedRecords,
  parsePpcVolumesWorkbook,
} from "@/domain/disp/import/excel";
import type { DispanserizationPayload } from "@/domain/presets/schema";
import { getPreset, updatePreset } from "@/domain/presets/service";
import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

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
  if (preset.kind !== "dispanserization")
    return jsonError("Only for dispanserization presets", 400);

  try {
    const imported = await parsePpcVolumesWorkbook(
      Buffer.from(await file.arrayBuffer()),
    );
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
