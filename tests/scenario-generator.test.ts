import { describe, expect, test } from "vitest";

import { getCachedScenario } from "../lib/ai/scenario-generator";

describe("scenario-generator", () => {
  test("exact match returns a scenario with matching type and difficulty", () => {
    const scenario = getCachedScenario({ type: "phishing", difficulty: "easy" });

    expect(scenario).not.toBeNull();
    expect(scenario?.type).toBe("phishing");
    expect(scenario?.difficulty).toBe("easy");
  });

  test("same-type fallback works when exact difficulty does not exist", () => {
    const scenario = getCachedScenario({ type: "malware", difficulty: "hard" });

    expect(scenario).not.toBeNull();
    expect(scenario?.type).toBe("malware");
  });

  test("random pool fallback works when requested type has no entries", () => {
    const scenario = getCachedScenario({ type: "unknown-type" as unknown as "phishing", difficulty: "easy" });

    expect(scenario).not.toBeNull();
    expect(["phishing", "smishing", "impersonation", "malware"]).toContain(scenario?.type);
  });
});
