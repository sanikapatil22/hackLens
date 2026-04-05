type UserProfileInput = {
  weak_areas?: string[];
  strengths?: string[];
  behavior_pattern?: string;
  avg_score?: number;
  accuracy?: number;
  total_attempts?: number;
  recent_trend?: string;
};

function normalizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 4);
}

function compactLine(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 217)}...`;
}

function buildCachedSummary(profile: UserProfileInput, strategyInsights: string[]): string {
  const strengths = normalizeList(profile.strengths);
  const weakAreas = normalizeList(profile.weak_areas);
  const topWeak = weakAreas[0] ?? 'core threat analysis';
  const topStrength = strengths[0] ?? 'consistent effort';
  const avgScore = typeof profile.avg_score === 'number' ? Math.round(profile.avg_score) : (profile.accuracy ?? 0);
  const behavior = profile.behavior_pattern ?? (avgScore >= 60 ? 'proactive' : 'reactive');
  const strategyHint = strategyInsights[0] ?? 'Improve investigation depth and response consistency.';

  return compactLine(
    `You are strong in ${topStrength} but need improvement in ${weakAreas.join(', ') || topWeak}. ` +
    `Current pattern is ${behavior} with average score ${avgScore}/100. Focus on ${topWeak} next. ${strategyHint}`
  );
}

async function buildAiSummary(
  profile: UserProfileInput,
  strategyInsights: string[],
  recentSimulationPerformance?: string
): Promise<string | null> {
  const response = await fetch('/api/explainer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Global AI Summary',
      vulnerabilityType: [
        'Generate a concise summary of the user\'s cybersecurity performance, strengths, weaknesses, and what they should focus on next.',
        'Return only 1-2 lines in plain text.',
        `Profile: ${JSON.stringify(profile)}`,
        `Strategy insights: ${JSON.stringify(strategyInsights.slice(0, 5))}`,
        `Recent simulation performance: ${recentSimulationPerformance ?? 'N/A'}`,
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    explanation?: {
      insight?: string;
      fix?: string;
    };
  };

  const insight = payload.explanation?.insight?.trim();
  const fix = payload.explanation?.fix?.trim();

  if (!insight) {
    return null;
  }

  const merged = fix ? `${insight} ${fix}` : insight;
  return compactLine(merged);
}

export async function generateAISummary(
  profile: UserProfileInput,
  strategyInsights: string[],
  recentSimulationPerformance?: string,
  mode: 'ai' | 'cache' = 'ai'
): Promise<string> {
  if (mode === 'cache') {
    return buildCachedSummary(profile, strategyInsights);
  }

  try {
    const aiSummary = await buildAiSummary(profile, strategyInsights, recentSimulationPerformance);
    if (aiSummary) {
      return aiSummary;
    }
  } catch {
    // Ignore AI errors and fallback deterministically.
  }

  return buildCachedSummary(profile, strategyInsights);
}
