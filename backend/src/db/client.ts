import pg from "pg";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected pool error");
});

/**
 * Test database connectivity. Returns true if the connection succeeds.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (err) {
    logger.error({ err }, "Database connection test failed");
    return false;
  }
}
