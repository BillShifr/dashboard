export const ROLE_OPTIONS = [
  { id: "admin", label: "Администратор" },
  { id: "editor", label: "Редактор" },
  { id: "viewer", label: "Просмотр" },
] as const;

export type RoleId = (typeof ROLE_OPTIONS)[number]["id"];

export function roleLabel(role: RoleId) {
  return ROLE_OPTIONS.find((item) => item.id === role)?.label ?? role;
}
