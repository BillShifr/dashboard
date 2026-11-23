import { z } from "zod";
import { PASSWORD_MIN } from "@/domain/users/password";

export const roleSchema = z.enum(["viewer", "editor", "admin"]);

export const loginSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/);

export const personNameSchema = z.string().trim().min(1).max(120);

export const passwordSchema = z.string().min(PASSWORD_MIN).max(200);

export const createUserSchema = z.object({
  login: loginSchema,
  fullName: personNameSchema,
  role: roleSchema,
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  login: loginSchema,
  fullName: personNameSchema,
  role: roleSchema,
  isActive: z.boolean(),
  password: z.string().max(200).optional(),
});

export const revisePresetSchema = z.object({
  name: z.string().trim().min(1).max(120),
  ownerUserId: z.string().uuid(),
});
