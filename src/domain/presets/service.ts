import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auditEvents, presets } from "@/db/schema";
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
