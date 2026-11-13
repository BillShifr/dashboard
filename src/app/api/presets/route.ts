import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { createPresetSchema } from "@/domain/presets/schema";
import { createPreset, listPresets } from "@/domain/presets/service";

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const rows = await listPresets(user);
  return Response.json({ presets: rows });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role === "viewer") return jsonError("Forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createPresetSchema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", 400);

  try {
    const row = await createPreset(user, parsed.data);
    return Response.json({ preset: row }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("Invalid payload", 400);
    if (error instanceof Error && error.message === "FORBIDDEN")
      return jsonError("Forbidden", 403);
    throw error;
  }
}
