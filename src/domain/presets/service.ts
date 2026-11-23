import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auditEvents, presets, users } from "@/db/schema";
import {
  parsePresetPayload,
  type createPresetSchema,
  type updatePresetSchema,
} from "@/domain/presets/schema";
import type { z } from "zod";

type Actor = {
  id: string;
  organizationId: string;
  role: "viewer" | "editor" | "admin";
};

export async function listPresets(actor: Actor) {
  return db
    .select({
      id: presets.id,
      kind: presets.kind,
      name: presets.name,
      version: presets.version,
      ownerUserId: presets.ownerUserId,
      updatedAt: presets.updatedAt,
      createdAt: presets.createdAt,
    })
    .from(presets)
    .where(
      and(
        eq(presets.organizationId, actor.organizationId),
        eq(presets.isActive, true),
      ),
    )
    .orderBy(desc(presets.updatedAt));
}

export async function getPreset(actor: Actor, id: string) {
  const [row] = await db
    .select()
    .from(presets)
    .where(
      and(
        eq(presets.id, id),
        eq(presets.organizationId, actor.organizationId),
        eq(presets.isActive, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createPreset(
  actor: Actor,
  input: z.infer<typeof createPresetSchema>,
) {
  if (actor.role === "viewer") throw new Error("FORBIDDEN");
  const payload = parsePresetPayload(input.kind, input.payload);
  const [row] = await db
    .insert(presets)
    .values({
      organizationId: actor.organizationId,
      ownerUserId: actor.id,
      kind: input.kind,
      name: input.name,
      payload,
      version: 1,
    })
    .returning();
  await db.insert(auditEvents).values({
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "preset.created",
    objectType: "preset",
    objectId: row!.id,
    metadata: { kind: input.kind, name: input.name },
  });
  return row!;
}

export async function updatePreset(
  actor: Actor,
  id: string,
  input: z.infer<typeof updatePresetSchema>,
) {
  if (actor.role === "viewer") throw new Error("FORBIDDEN");
  const existing = await getPreset(actor, id);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.version !== input.expectedVersion)
    throw new Error("VERSION_CONFLICT");

  const payload =
    input.payload === undefined
      ? existing.payload
      : parsePresetPayload(existing.kind, input.payload);

  const [row] = await db
    .update(presets)
    .set({
      name: input.name ?? existing.name,
      payload,
      version: existing.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(presets.id, id))
    .returning();

  await db.insert(auditEvents).values({
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "preset.updated",
    objectType: "preset",
    objectId: id,
    metadata: {
      fromVersion: existing.version,
      toVersion: existing.version + 1,
    },
  });
  return row!;
}

function uniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code: string }).code === "23505")
    return true;
  if ("cause" in error)
    return uniqueViolation((error as { cause: unknown }).cause);
  return false;
}

export async function listPresetDirectory(actor: Actor) {
  if (actor.role !== "admin") throw new Error("FORBIDDEN");
  return db
    .select({
      id: presets.id,
      kind: presets.kind,
      name: presets.name,
      version: presets.version,
      ownerUserId: presets.ownerUserId,
      ownerName: users.fullName,
      ownerLogin: users.login,
      updatedAt: presets.updatedAt,
    })
    .from(presets)
    .innerJoin(users, eq(users.id, presets.ownerUserId))
    .where(
      and(
        eq(presets.organizationId, actor.organizationId),
        eq(presets.isActive, true),
      ),
    )
    .orderBy(desc(presets.updatedAt));
}

export async function revisePreset(
  actor: Actor,
  id: string,
  input: { name: string; ownerUserId: string },
) {
  if (actor.role !== "admin") throw new Error("FORBIDDEN");
  const existing = await getPreset(actor, id);
  if (!existing) throw new Error("NOT_FOUND");

  const [owner] = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(
      and(
        eq(users.id, input.ownerUserId),
        eq(users.organizationId, actor.organizationId),
      ),
    )
    .limit(1);
  if (!owner?.isActive) throw new Error("OWNER_UNAVAILABLE");

  try {
    const [row] = await db
      .update(presets)
      .set({
        name: input.name,
        ownerUserId: input.ownerUserId,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(presets.id, id))
      .returning({
        id: presets.id,
        name: presets.name,
        version: presets.version,
        ownerUserId: presets.ownerUserId,
      });
    await db.insert(auditEvents).values({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "preset.revised",
      objectType: "preset",
      objectId: id,
      metadata: {
        name: input.name,
        ownerUserId: input.ownerUserId,
        fromVersion: existing.version,
      },
    });
    return row!;
  } catch (error) {
    if (uniqueViolation(error)) throw new Error("DUPLICATE");
    throw error;
  }
}

export async function deletePreset(actor: Actor, id: string) {
  if (actor.role === "viewer") throw new Error("FORBIDDEN");
  const existing = await getPreset(actor, id);
  if (!existing) throw new Error("NOT_FOUND");
  if (actor.role !== "admin" && existing.ownerUserId !== actor.id)
    throw new Error("FORBIDDEN");

  await db
    .update(presets)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(presets.id, id));
  await db.insert(auditEvents).values({
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "preset.deleted",
    objectType: "preset",
    objectId: id,
    metadata: { kind: existing.kind, name: existing.name },
  });
}
