type LearningProfileInput = {
  weak_areas?: string[];
  strengths?: string[];
  behavior_pattern?: string;
};

function normalizeTopic(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '_');
}

function unique(items: string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) {
      out.push(item);
    }
  }
  return out;
}

function buildCachedLearningPath(profile: LearningProfileInput): string[] {
  const weakAreas = (profile.weak_areas ?? []).map(normalizeTopic);
  const steps: string[] = [];

  if (weakAreas.some((area) => area.includes('lateral_movement'))) {
    steps.push('Practice lateral movement detection and host-to-host anomaly triage.');
  }

  if (weakAreas.some((area) => area.includes('input_validation') || area.includes('inject'))) {
    steps.push('Review input validation vulnerabilities and apply parameterized defenses.');
  }

  if (weakAreas.some((area) => area.includes('privilege') || area.includes('escalation'))) {
    steps.push('Train on privilege escalation indicators and least-privilege containment playbooks.');
  }

  if (steps.length < 3) {
    steps.push('Run one adaptive simulation and document why each defensive choice was made.');
  }

  if (steps.length < 3) {
    steps.push('Inspect logs before containment to improve root-cause confidence.');
  }

  if (steps.length < 3) {
    steps.push('Finish with a fix-verification pass and capture prevention notes.');
  }

  return unique(steps).slice(0, 3);
}

async function buildAiLearningPath(profile: LearningProfileInput): Promise<string[] | null> {
  const response = await fetch('/api/explainer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Guided Learning Path',
      vulnerabilityType: [
        'Based on this user\'s weaknesses and strengths, suggest 3 next cybersecurity training steps.',
        'Return as semicolon-separated plain text steps in insight.',
        `Profile: ${JSON.stringify(profile)}`,
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    explanation?: {
      insight?: string;
    };
  };

  const steps = (payload.explanation?.insight ?? '')
    .split(';')
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .slice(0, 3);

  if (steps.length !== 3) {
    return null;
  }

  return steps;
}

export async function generateLearningPath(
  profile: LearningProfileInput,
  mode: 'ai' | 'cache' = 'ai'
): Promise<string[]> {
  if (mode === 'cache') {
    return buildCachedLearningPath(profile);
  }

  try {
    const ai = await buildAiLearningPath(profile);
    if (ai && ai.length === 3) {
      return ai;
    }
  } catch {
    // Ignore AI errors and fallback deterministically.
  }

  return buildCachedLearningPath(profile);
}
