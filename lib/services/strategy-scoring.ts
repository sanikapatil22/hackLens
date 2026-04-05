export type StrategyHistoryEntry = {
  classification: 'correct' | 'partial' | 'incorrect';
  action: string;
  reasoning?: {
    missed_points?: string[];
    correct_points?: string[];
  };
};

export type StrategyScoreResult = {
  score: number;
  insights: string[];
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeDeterministicStrategyScore(history: StrategyHistoryEntry[]): StrategyScoreResult {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      score: 50,
      insights: ['No strategy history yet. Run a few attempts to generate feedback.'],
    };
  }

  const total = history.length;
  const incorrect = history.filter((h) => h.classification === 'incorrect').length;
  const partial = history.filter((h) => h.classification === 'partial').length;
  const firstCorrectIndex = history.findIndex((h) => h.classification === 'correct');

  const missingLogs = history.filter((h) => {
    const action = h.action.toLowerCase();
    return !action.includes('log') && !action.includes('audit') && !action.includes('monitor');
  }).length;

  const missedRootCause = history.filter((h) => (h.reasoning?.missed_points?.length ?? 0) > (h.reasoning?.correct_points?.length ?? 0)).length;

  let score = 85;
  score -= incorrect * 12;
  score -= partial * 6;
  score -= Math.floor((missingLogs / total) * 20);
  score -= Math.floor((missedRootCause / total) * 15);

  if (firstCorrectIndex > 0) {
    score -= Math.min(20, firstCorrectIndex * 4);
  }

  const insights: string[] = [];

  if (incorrect >= Math.max(2, Math.ceil(total * 0.5))) {
    insights.push('Pattern: reactive response under pressure (frequent incorrect actions).');
  }

  if (firstCorrectIndex >= 2) {
    insights.push('Pattern: slow detection (correct action appears late in the sequence).');
  }

  if (missingLogs >= Math.max(2, Math.ceil(total * 0.6))) {
    insights.push('Pattern: lack of investigation (log/audit checks are often skipped).');
  }

  if (missedRootCause >= Math.max(2, Math.ceil(total * 0.5))) {
    insights.push('Pattern: root cause is frequently missed in follow-up reasoning.');
  }

  if (insights.length === 0) {
    insights.push('Pattern: strategy is trending proactive and investigation-aware.');
  }

  return {
    score: clampScore(score),
    insights,
  };
}

function parseAiScoreText(value: string): number | null {
  const match = value.match(/(score\s*[:=]\s*|^)(\d{1,3})/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[2]);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return clampScore(parsed);
}

async function computeAiStrategyScore(history: StrategyHistoryEntry[]): Promise<StrategyScoreResult | null> {
  const response = await fetch('/api/explainer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Strategy Scoring',
      vulnerabilityType: [
        'Analyze the user\'s cybersecurity strategy based on these actions.',
        'Return strict JSON with these string fields only:',
        '- insight: semicolon-separated strategy insights',
        '- risk: include numeric score like "score: 72"',
        '- fix: one concise improvement recommendation',
        '',
        `History: ${JSON.stringify(history.slice(-12))}`,
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    explanation?: {
      insight?: string;
      risk?: string;
      fix?: string;
    };
  };

  const score = parseAiScoreText(payload.explanation?.risk ?? '');
  const insights = (payload.explanation?.insight ?? '')
    .split(';')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 4);

  const fix = payload.explanation?.fix?.trim();
  if (fix) {
    insights.push(`Recommendation: ${fix}`);
  }

  if (score === null || insights.length === 0) {
    return null;
  }

  return {
    score,
    insights,
  };
}

export async function computeStrategyScore(
  history: StrategyHistoryEntry[],
  mode: 'ai' | 'cache' = 'ai'
): Promise<StrategyScoreResult> {
  if (mode === 'cache') {
    return computeDeterministicStrategyScore(history);
  }

  try {
    const aiResult = await computeAiStrategyScore(history);
    if (aiResult) {
      return aiResult;
    }
  } catch {
    // Ignore AI errors and fallback deterministically.
  }

  return computeDeterministicStrategyScore(history);
}
