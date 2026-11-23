import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { auditEvents, sessions, users } from "@/db/schema";
import { blockedAdminChange, type Role } from "@/domain/admin/guards";
import { hashPassword } from "@/domain/users/password";

type Actor = {
  id: string;
  organizationId: string;
  role: Role;
};

export type DirectoryUser = {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  isActive: boolean;
};

function assertAdmin(actor: Actor) {
  if (actor.role !== "admin") throw new Error("FORBIDDEN");
}

function uniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code: string }).code === "23505")
    return true;
  if ("cause" in error)
    return uniqueViolation((error as { cause: unknown }).cause);
  return false;
}

async function activeAdminCount(organizationId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, "admin"),
        eq(users.isActive, true),
      ),
    );
  return Number(row?.count ?? 0);
}

async function revokeSessions(userId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function listDirectory(actor: Actor): Promise<DirectoryUser[]> {
  assertAdmin(actor);
  return db
    .select({
      id: users.id,
      login: users.login,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.organizationId, actor.organizationId))
    .orderBy(asc(users.login));
}

export async function createDirectoryUser(
  actor: Actor,
  input: { login: string; fullName: string; role: Role; password: string },
) {
  assertAdmin(actor);
  const passwordHash = await hashPassword(input.password);
  try {
    const [row] = await db
      .insert(users)
      .values({
        organizationId: actor.organizationId,
        login: input.login,
        fullName: input.fullName,
        role: input.role,
        passwordHash,
        isActive: true,
      })
      .returning({
        id: users.id,
        login: users.login,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
      });
    await db.insert(auditEvents).values({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "user.created",
      objectType: "user",
      objectId: row!.id,
      metadata: { login: input.login, role: input.role },
    });
    return row!;
  } catch (error) {
    if (uniqueViolation(error)) throw new Error("DUPLICATE");
    throw error;
  }
}

export async function updateDirectoryUser(
  actor: Actor,
  id: string,
  input: {
    login: string;
    fullName: string;
    role: Role;
    isActive: boolean;
    password?: string;
  },
) {
  assertAdmin(actor);
  const [target] = await db
    .select({
      id: users.id,
      login: users.login,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(
      and(eq(users.id, id), eq(users.organizationId, actor.organizationId)),
    )
    .limit(1);
  if (!target) throw new Error("NOT_FOUND");

  const blocked = blockedAdminChange({
    actorId: actor.id,
    target,
    next: { role: input.role, isActive: input.isActive },
    activeAdminCount: await activeAdminCount(actor.organizationId),
  });
  if (blocked) throw new Error(blocked);

  const passwordHash = input.password
    ? await hashPassword(input.password)
    : undefined;

  try {
    const [row] = await db
      .update(users)
      .set({
        login: input.login,
        fullName: input.fullName,
        role: input.role,
        isActive: input.isActive,
        ...(passwordHash ? { passwordHash } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        login: users.login,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
      });

    if (!input.isActive || passwordHash) await revokeSessions(id);

    await db.insert(auditEvents).values({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: passwordHash ? "user.password_reset" : "user.updated",
      objectType: "user",
      objectId: id,
      metadata: {
        login: input.login,
        role: input.role,
        isActive: input.isActive,
        passwordReset: Boolean(passwordHash),
      },
    });
    return row!;
  } catch (error) {
    if (uniqueViolation(error)) throw new Error("DUPLICATE");
    throw error;
  }
}
