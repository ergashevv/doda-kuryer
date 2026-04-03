import { URL } from "node:url";
import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function requireHost(urlString: string) {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }
  if (!(parsed.hostname || "").trim()) {
    throw new Error("DATABASE_URL must include a host");
  }
}

function poolOptions(connectionString: string): pg.PoolConfig {
  const opts: pg.PoolConfig = { connectionString };
  const needsSsl =
    /sslmode=(require|verify-full)/i.test(connectionString) ||
    connectionString.includes("neon.tech") ||
    process.env.DATABASE_SSL === "1" ||
    process.env.DASHBOARD_DATABASE_SSL === "true";
  if (needsSsl) {
    opts.ssl = { rejectUnauthorized: true };
  }
  return opts;
}

export function getPool(): pg.Pool {
  if (pool) return pool;
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for the dashboard");
  }
  requireHost(url);
  pool = new Pool(poolOptions(url));
  return pool;
}
