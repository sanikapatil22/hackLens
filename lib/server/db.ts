import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const CONNECTION_COOLDOWN_MS = 30_000;

let connectionUnavailableUntil = 0;
let lastConnectionWarningAt = 0;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractErrorCode(error: unknown): string | null {
  if (isRecord(error) && typeof error.code === "string") {
    return error.code;
  }

  return null;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (isRecord(error) && Array.isArray(error.errors) && error.errors.length > 0) {
    const first = error.errors[0];
    if (first instanceof Error && first.message.trim().length > 0) {
      return first.message;
    }

    if (isRecord(first) && typeof first.message === "string" && first.message.trim().length > 0) {
      return first.message;
    }
  }

  return "Database query failed";
}

function isConnectionFailure(error: unknown): boolean {
  const code = extractErrorCode(error);
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT") {
    return true;
  }

  if (isRecord(error) && Array.isArray(error.errors)) {
    return error.errors.some((nested) => {
      const nestedCode = extractErrorCode(nested);
      return nestedCode === "ECONNREFUSED" || nestedCode === "ENOTFOUND" || nestedCode === "ETIMEDOUT";
    });
  }

  return false;
}

export async function query(text: string, params?: unknown[]) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const now = Date.now();
  if (connectionUnavailableUntil > now) {
    throw new Error("Database unavailable (connection cooldown active)");
  }

  try {
    const res = await pool.query(text, params);
    connectionUnavailableUntil = 0;
    return res;
  } catch (error) {
    if (isConnectionFailure(error)) {
      connectionUnavailableUntil = Date.now() + CONNECTION_COOLDOWN_MS;
      if (Date.now() - lastConnectionWarningAt > 5_000) {
        lastConnectionWarningAt = Date.now();
        console.warn("[DB WARNING]", `${extractErrorMessage(error)}. Skipping DB calls for ${CONNECTION_COOLDOWN_MS / 1000}s.`);
      }

      throw new Error(extractErrorMessage(error));
    }

    throw error instanceof Error ? error : new Error(extractErrorMessage(error));
  }
}
