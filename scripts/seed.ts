import { hash } from "@node-rs/argon2";
import postgres from "postgres";
import { loadEnv } from "./load-env";

loadEnv();
const ORGANIZATION_NAME = "ТФОМС Югры";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const sql = postgres(databaseUrl, { max: 1 });

const password = process.env.INITIAL_ADMIN_PASSWORD;
if (!password || password.length < 16)
  throw new Error("INITIAL_ADMIN_PASSWORD (16+) is required for local seed");

let [organization] =
  await sql`SELECT id FROM organizations WHERE name=${ORGANIZATION_NAME} ORDER BY created_at LIMIT 1`;
if (!organization) {
  [organization] =
    await sql`INSERT INTO organizations(name) VALUES (${ORGANIZATION_NAME}) RETURNING id`;
}

const passwordHash = await hash(password, {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

for (const user of [
  {
    login: "admin",
    fullName: "Администратор",
    role: "admin",
  },
  {
    login: "editor",
    fullName: "Редактор",
    role: "editor",
  },
] as const) {
  const [existing] =
    await sql`SELECT id FROM users WHERE organization_id=${organization.id} AND login=${user.login}`;
  if (existing) continue;
  await sql`
    INSERT INTO users(organization_id, login, full_name, password_hash, role, is_active)
    VALUES (${organization.id}, ${user.login}, ${user.fullName}, ${passwordHash}, ${user.role}, true)
  `;
}

console.info("Local seed completed");
await sql.end();
