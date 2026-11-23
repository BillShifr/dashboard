export type Role = "viewer" | "editor" | "admin";

export function blockedAdminChange(input: {
  actorId: string;
  target: { id: string; role: Role; isActive: boolean };
  next: { role: Role; isActive: boolean };
  activeAdminCount: number;
}): "SELF_DEACTIVATE" | "LAST_ADMIN" | null {
  if (
    input.actorId === input.target.id &&
    input.target.isActive &&
    !input.next.isActive
  ) {
    return "SELF_DEACTIVATE";
  }

  const wasActiveAdmin = input.target.role === "admin" && input.target.isActive;
  const staysActiveAdmin = input.next.role === "admin" && input.next.isActive;
  if (wasActiveAdmin && !staysActiveAdmin && input.activeAdminCount <= 1) {
    return "LAST_ADMIN";
  }

  return null;
}
