import { z } from "zod";
import { applyReferenceToPayload } from "@/domain/disp/import/reference";
import type { DispanserizationPayload } from "@/domain/presets/schema";
import { getPreset, updatePreset } from "@/domain/presets/service";
import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";

const bodySchema = z.object({ expectedVersion: z.number().int().positive() });

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role === "viewer") return jsonError("Forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", 400);

  const { id } = await params;
  const preset = await getPreset(user, id);
  if (!preset) return jsonError("Not found", 404);
  if (preset.kind !== "dispanserization")
    return jsonError("Only for dispanserization presets", 400);

  try {
    const nextPayload = applyReferenceToPayload(
      preset.payload as DispanserizationPayload,
    );
    const row = await updatePreset(user, id, {
      expectedVersion: parsed.data.expectedVersion,
      payload: nextPayload,
    });
    return Response.json({ preset: row });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VERSION_CONFLICT")
        return jsonError("Version conflict", 409);
      if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    }
    throw error;
  }
}
