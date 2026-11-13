import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { updatePresetSchema } from "@/domain/presets/schema";
import {
  deletePreset,
  getPreset,
  updatePreset,
} from "@/domain/presets/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const row = await getPreset(user, id);
  if (!row) return jsonError("Not found", 404);
  return Response.json({ preset: row });
}

export async function PUT(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role === "viewer") return jsonError("Forbidden", 403);
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = updatePresetSchema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", 400);

  try {
    const row = await updatePreset(user, id, parsed.data);
    return Response.json({ preset: row });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Invalid payload", 400);
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") return jsonError("Not found", 404);
      if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
      if (error.message === "VERSION_CONFLICT")
        return jsonError("Version conflict", 409);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  try {
    await deletePreset(user, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") return jsonError("Not found", 404);
      if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    }
    throw error;
  }
}
