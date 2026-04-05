import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : undefined
);

export async function query(text: string, params?: unknown[]) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error("[DB ERROR]", error);
    throw error;
  }
}
