import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * `prepare: false` is required by Supabase's transaction pooler. The small pool
 * suits serverless: each instance keeps just enough sockets for the handful of
 * queries a page runs in parallel, and drops them when idle instead of holding
 * pooler slots open.
 */
const client = postgres(connectionString, {
  prepare: false,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
