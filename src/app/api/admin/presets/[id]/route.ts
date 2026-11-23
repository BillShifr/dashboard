import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { adminError } from "@/app/api/admin/errors";
import { revisePresetSchema } from "@/domain/admin/schemas";
import { revisePreset } from "@/domain/presets/service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return jsonError("Нужно войти", 401);
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }
  const parsed = revisePresetSchema.safeParse(body);
  if (!parsed.success) return jsonError("Проверьте поля", 400);
  try {
    const row = await revisePreset(user, id, parsed.data);
    return Response.json({ preset: row });
  } catch (error) {
    return adminError(error) ?? jsonError("Не удалось сохранить отчёт", 500);
  }
}
