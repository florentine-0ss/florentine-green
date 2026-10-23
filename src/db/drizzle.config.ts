import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const sqlHost = process.env.SQL_HOST || "localhost";
const sqlDbName = process.env.SQL_DB_NAME || "fofogreen";
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || "postgres";
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "";

console.log(`[Drizzle Config] Configured for ${sqlDbName} on ${sqlHost} as ${user}`);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  },
  verbose: true,
});
