import { beforeEach, describe, expect, test, vi } from "vitest";

describe("rate limiter", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  test("allows requests under limit", async () => {
    const { canMakeAIRequest } = await import("../lib/ai/rate-limiter");

    for (let i = 0; i < 5; i += 1) {
      expect(canMakeAIRequest()).toBe(true);
      vi.advanceTimersByTime(1);
    }
  });

  test("blocks requests over limit", async () => {
    const { canMakeAIRequest, getCooldownTime } = await import("../lib/ai/rate-limiter");

    for (let i = 0; i < 5; i += 1) {
      canMakeAIRequest();
      vi.advanceTimersByTime(1);
    }

    expect(canMakeAIRequest()).toBe(false);
    expect(getCooldownTime()).toBeGreaterThan(0);
  });

  test("cooldown resets after one minute", async () => {
    const { canMakeAIRequest, getCooldownTime } = await import("../lib/ai/rate-limiter");

    for (let i = 0; i < 5; i += 1) {
      canMakeAIRequest();
      vi.advanceTimersByTime(1);
    }

    expect(canMakeAIRequest()).toBe(false);

    vi.advanceTimersByTime(60_000);

    expect(getCooldownTime()).toBe(0);
    expect(canMakeAIRequest()).toBe(true);
  });
});
