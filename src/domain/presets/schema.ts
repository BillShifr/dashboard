import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const territoryPayloadSchema = z.object({
  version: z.literal(1),
  mode: z.enum(["geo", "hex", "med"]),
  medicalBase: z.enum(["geo", "hex"]),
  scale: z.enum(["traffic", "green", "blue"]),
  districts: z.boolean(),
  cities: z.boolean(),
  outline: hexColor,
  items: z
    .array(
      z.object({
        number: z.string().regex(/^\d{1,4}$/),
        color: hexColor,
        value: z.number().min(0).max(1_000_000).nullable(),
        manual: hexColor.nullable(),
      }),
    )
    .length(9),
  records: z.record(
    z.string(),
    z.object({
      value: z.number().min(0).max(1_000_000).nullable(),
      manual: hexColor.nullable(),
    }),
  ),
});

export const dispanserizationPayloadSchema = z.object({
  version: z.literal(5),
  project: z.string().min(1).max(120),
  view: z.enum(["geo", "hex", "med"]),
  medicalBase: z.enum(["geo", "hex"]),
  palette: z.enum(["traffic", "green", "blue"]),
  labels: z.boolean(),
  cityLabels: z.boolean(),
  outline: hexColor,
  showDetails: z.boolean(),
  onlyPlanned: z.boolean(),
  records: z.record(
    z.string(),
    z.object({
      plan: z.number().min(0).max(1_000_000_000).nullable(),
      fact: z.number().min(0).max(1_000_000_000).nullable(),
      color: hexColor.nullable(),
    }),
  ),
  groupColors: z.record(z.string(), hexColor),
});

export const presetKindSchema = z.enum(["territory", "dispanserization"]);

export const createPresetSchema = z.object({
  kind: presetKindSchema,
  name: z.string().trim().min(1).max(120),
  payload: z.unknown(),
});

export const updatePresetSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  payload: z.unknown().optional(),
  expectedVersion: z.number().int().positive(),
});

export function parsePresetPayload(
  kind: "territory" | "dispanserization",
  payload: unknown,
) {
  if (kind === "territory") return territoryPayloadSchema.parse(payload);
  return dispanserizationPayloadSchema.parse(payload);
}

export type TerritoryPayload = z.infer<typeof territoryPayloadSchema>;
export type DispanserizationPayload = z.infer<
  typeof dispanserizationPayloadSchema
>;
