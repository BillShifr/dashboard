import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { adminError } from "@/app/api/admin/errors";
import { updateUserSchema } from "@/domain/admin/schemas";
import { PASSWORD_MIN } from "@/domain/users/password";
import { updateDirectoryUser } from "@/domain/users/service";

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
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return jsonError("Проверьте поля", 400);
  const password = parsed.data.password?.trim();
  if (password && password.length < PASSWORD_MIN)
    return jsonError("Проверьте поля", 400);
  try {
    const row = await updateDirectoryUser(user, id, {
      ...parsed.data,
      password: password || undefined,
    });
    return Response.json({ user: row });
  } catch (error) {
    return (
      adminError(error) ?? jsonError("Не удалось сохранить пользователя", 500)
    );
  }
}
