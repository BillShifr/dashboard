import { currentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { adminError } from "@/app/api/admin/errors";
import { createUserSchema } from "@/domain/admin/schemas";
import { createDirectoryUser, listDirectory } from "@/domain/users/service";

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Нужно войти", 401);
  try {
    return Response.json({ users: await listDirectory(user) });
  } catch (error) {
    return adminError(error) ?? jsonError("Не удалось прочитать список", 500);
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Нужно войти", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return jsonError("Проверьте поля", 400);
  try {
    const row = await createDirectoryUser(user, parsed.data);
    return Response.json({ user: row }, { status: 201 });
  } catch (error) {
    return (
      adminError(error) ?? jsonError("Не удалось создать пользователя", 500)
    );
  }
}
