import { log } from "./logger";

const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000;

let requestTimestamps: number[] = [];

function getActiveTimestamps(now: number): number[] {
  requestTimestamps = requestTimestamps.filter((time) => now - time < WINDOW_MS);
  return requestTimestamps;
}

export function canMakeAIRequest(): boolean {
  const now = Date.now();
  const active = getActiveTimestamps(now);

  if (active.length >= MAX_REQUESTS) {
    log("warn", "rate_limit_exceeded", {
      userId: "anonymous",
      timestamp: now,
    });
    return false;
  }

  requestTimestamps = [...active, now];
  return true;
}

export function getCooldownTime(): number {
  const now = Date.now();
  const active = getActiveTimestamps(now);

  if (active.length < MAX_REQUESTS) {
    return 0;
  }

  const oldestActive = active[0];
  const remainingMs = WINDOW_MS - (now - oldestActive);
  return Math.max(0, Math.ceil(remainingMs / 1000));
}
