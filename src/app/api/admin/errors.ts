import { jsonError } from "@/lib/http";

export function adminError(error: unknown) {
  if (!(error instanceof Error)) return null;
  switch (error.message) {
    case "FORBIDDEN":
      return jsonError("Недостаточно прав", 403);
    case "NOT_FOUND":
      return jsonError("Не найдено", 404);
    case "DUPLICATE":
      return jsonError("Такое имя уже занято", 409);
    case "LAST_ADMIN":
      return jsonError("Нужен хотя бы один действующий администратор", 409);
    case "SELF_DEACTIVATE":
      return jsonError("Свою учётную запись отключить нельзя", 409);
    case "OWNER_UNAVAILABLE":
      return jsonError("Владелец должен быть действующим пользователем", 409);
    default:
      return null;
  }
}
