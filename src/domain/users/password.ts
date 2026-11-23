import { hash } from "@node-rs/argon2";

export const PASSWORD_MIN = 12;

export function hashPassword(password: string) {
  return hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}
