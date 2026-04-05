export type ReplayTimelineEntry = {
  stepIndex: number;
  userAction: string;
  attackerResponse: string;
  narration?: string;
};

export type ReplaySpeed = 'slow' | 'normal' | 'fast';

export function buildReplayTimeline(history: ReplayTimelineEntry[]): ReplayTimelineEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return [...history]
    .filter((entry) => {
      return (
        typeof entry.stepIndex === 'number' &&
        typeof entry.userAction === 'string' &&
        typeof entry.attackerResponse === 'string'
      );
    })
    .sort((a, b) => a.stepIndex - b.stepIndex)
    .map((entry) => ({
      stepIndex: entry.stepIndex,
      userAction: entry.userAction,
      attackerResponse: entry.attackerResponse,
      narration: entry.narration,
    }));
}

export function replayDelay(speed: ReplaySpeed): number {
  if (speed === 'slow') {
    return 1300;
  }

  if (speed === 'fast') {
    return 500;
  }

  return 900;
}
