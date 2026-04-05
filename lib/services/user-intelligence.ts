type InteractionClassification = 'correct' | 'partial' | 'incorrect';

export type InteractionForIntelligence = {
  scenarioType: string;
  isCorrect: boolean;
  selectedAction?: string | null;
  correctAction?: string | null;
  classification?: InteractionClassification | null;
  reasoning?: {
    correct_points?: string[];
    missed_points?: string[];
  } | null;
  score?: number | null;
};

export type UserIntelligenceProfile = {
  weak_areas: string[];
  strengths: string[];
  behavior_pattern: 'reactive' | 'proactive';
  avg_score: number;
};

function toClassification(value: InteractionForIntelligence): InteractionClassification {
  if (value.classification === 'correct' || value.classification === 'partial' || value.classification === 'incorrect') {
    return value.classification;
  }

  return value.isCorrect ? 'correct' : 'incorrect';
}

function normalizeTopic(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function scoreFromInteraction(interaction: InteractionForIntelligence): number {
  if (typeof interaction.score === 'number' && Number.isFinite(interaction.score)) {
    return Math.max(0, Math.min(100, interaction.score));
  }

  const classification = toClassification(interaction);
  if (classification === 'correct') {
    return 100;
  }

  if (classification === 'partial') {
    return 60;
  }

  return 25;
}

export function computeUserProfile(interactions: InteractionForIntelligence[]): UserIntelligenceProfile {
  if (!Array.isArray(interactions) || interactions.length === 0) {
    return {
      weak_areas: [],
      strengths: [],
      behavior_pattern: 'reactive',
      avg_score: 0,
    };
  }

  const topicStats = new Map<string, { attempts: number; correct: number; partial: number; incorrect: number }>();

  let totalScore = 0;
  let incorrectOrPartialCount = 0;
  let proactiveCount = 0;

  for (const interaction of interactions) {
    const topic = normalizeTopic(interaction.scenarioType || 'general');
    const classification = toClassification(interaction);
    const missedCount = interaction.reasoning?.missed_points?.length ?? 0;
    const correctCount = interaction.reasoning?.correct_points?.length ?? 0;

    const current = topicStats.get(topic) ?? {
      attempts: 0,
      correct: 0,
      partial: 0,
      incorrect: 0,
    };

    current.attempts += 1;
    if (classification === 'correct') {
      current.correct += 1;
    } else if (classification === 'partial') {
      current.partial += 1;
    } else {
      current.incorrect += 1;
    }

    topicStats.set(topic, current);

    totalScore += scoreFromInteraction(interaction);

    const isReactiveSignal = classification === 'incorrect' || (classification === 'partial' && missedCount > correctCount);
    if (isReactiveSignal) {
      incorrectOrPartialCount += 1;
    }

    if (classification === 'correct' || (classification === 'partial' && correctCount >= missedCount)) {
      proactiveCount += 1;
    }
  }

  const weak_areas = Array.from(topicStats.entries())
    .filter(([, data]) => data.attempts >= 2 && (data.incorrect + data.partial) / data.attempts >= 0.5)
    .sort((a, b) => {
      const aFailureRate = (a[1].incorrect + a[1].partial) / a[1].attempts;
      const bFailureRate = (b[1].incorrect + b[1].partial) / b[1].attempts;
      if (bFailureRate !== aFailureRate) {
        return bFailureRate - aFailureRate;
      }

      return b[1].attempts - a[1].attempts;
    })
    .map(([topic]) => topic)
    .slice(0, 5);

  const strengths = Array.from(topicStats.entries())
    .filter(([, data]) => data.attempts >= 2 && data.correct / data.attempts >= 0.7)
    .sort((a, b) => {
      const aSuccessRate = a[1].correct / a[1].attempts;
      const bSuccessRate = b[1].correct / b[1].attempts;
      if (bSuccessRate !== aSuccessRate) {
        return bSuccessRate - aSuccessRate;
      }

      return b[1].attempts - a[1].attempts;
    })
    .map(([topic]) => topic)
    .slice(0, 5);

  const behavior_pattern = proactiveCount >= incorrectOrPartialCount ? 'proactive' : 'reactive';
  const avg_score = Math.round((totalScore / interactions.length) * 10) / 10;

  return {
    weak_areas,
    strengths,
    behavior_pattern,
    avg_score,
  };
}