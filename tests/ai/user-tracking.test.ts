// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { getUserStats, logInteraction } from '@/lib/ai/user-tracking';

const STORAGE_KEY = 'hacklens_user_stats';

function createInteraction(overrides: Partial<{
  scenarioType: string;
  difficulty: string;
  isCorrect: boolean;
  selectedAction: string;
  correctAction: string;
  redFlags: string[];
  timestamp: number;
}> = {}) {
  return {
    scenarioType: 'phishing',
    difficulty: 'medium',
    isCorrect: false,
    selectedAction: 'Click link',
    correctAction: 'Report email',
    redFlags: ['Urgent language'],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('user-tracking', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  test('logInteraction stores data and interaction count increases', () => {
    const first = createInteraction({ timestamp: 1 });
    const second = createInteraction({ timestamp: 2, selectedAction: 'Open attachment' });

    logInteraction(first);
    logInteraction(second);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject(first);
    expect(parsed[1]).toMatchObject(second);
  });

  test('computes basic stats correctly for 5 attempts with 3 correct', () => {
    const interactions = [
      createInteraction({ isCorrect: true, scenarioType: 'phishing', selectedAction: 'Report email', timestamp: 1 }),
      createInteraction({ isCorrect: true, scenarioType: 'phishing', selectedAction: 'Report email', timestamp: 2 }),
      createInteraction({ isCorrect: true, scenarioType: 'smishing', selectedAction: 'Block sender', correctAction: 'Block sender', timestamp: 3 }),
      createInteraction({ isCorrect: false, scenarioType: 'smishing', selectedAction: 'Tap link', correctAction: 'Block sender', timestamp: 4 }),
      createInteraction({ isCorrect: false, scenarioType: 'malware', selectedAction: 'Run file', correctAction: 'Delete file', timestamp: 5 }),
    ];

    interactions.forEach((entry) => logInteraction(entry));

    const stats = getUserStats();

    expect(stats.totalAttempts).toBe(5);
    expect(stats.correctAttempts).toBe(3);
    expect(stats.accuracy).toBe(60);
  });

  test('computes byType accuracy correctly', () => {
    for (let i = 0; i < 5; i += 1) {
      logInteraction(
        createInteraction({
          scenarioType: 'phishing',
          isCorrect: i < 2,
          selectedAction: i < 2 ? 'Report email' : 'Click link',
          correctAction: 'Report email',
          timestamp: i + 1,
        })
      );
    }

    for (let i = 0; i < 3; i += 1) {
      logInteraction(
        createInteraction({
          scenarioType: 'smishing',
          isCorrect: true,
          selectedAction: 'Block sender',
          correctAction: 'Block sender',
          timestamp: i + 10,
        })
      );
    }

    const stats = getUserStats();

    expect(stats.byType.phishing.accuracy).toBe(40);
    expect(stats.byType.smishing.accuracy).toBe(100);
  });

  test('detects weak areas from low-accuracy types', () => {
    for (let i = 0; i < 5; i += 1) {
      logInteraction(
        createInteraction({
          scenarioType: 'phishing',
          isCorrect: i < 2,
          selectedAction: i < 2 ? 'Report email' : 'Click link',
          correctAction: 'Report email',
          timestamp: i + 1,
        })
      );
    }

    for (let i = 0; i < 4; i += 1) {
      logInteraction(
        createInteraction({
          scenarioType: 'smishing',
          isCorrect: true,
          selectedAction: 'Block sender',
          correctAction: 'Block sender',
          timestamp: i + 10,
        })
      );
    }

    const stats = getUserStats();

    expect(stats.weakAreas).toContain('phishing');
    expect(stats.weakAreas).not.toContain('smishing');
  });

  test('includes multiple weak areas when multiple types are below threshold', () => {
    for (let i = 0; i < 5; i += 1) {
      logInteraction(
        createInteraction({
          scenarioType: 'phishing',
          isCorrect: i === 0,
          selectedAction: i === 0 ? 'Report email' : 'Click link',
          correctAction: 'Report email',
          timestamp: i + 1,
        })
      );
    }

    for (let i = 0; i < 5; i += 1) {
      logInteraction(
        createInteraction({
          scenarioType: 'malware',
          isCorrect: i < 2,
          selectedAction: i < 2 ? 'Delete file' : 'Run file',
          correctAction: 'Delete file',
          timestamp: i + 20,
        })
      );
    }

    const stats = getUserStats();

    expect(stats.weakAreas).toEqual(expect.arrayContaining(['phishing', 'malware']));
  });

  test('tracks most frequent common mistakes', () => {
    const wrongActions = [
      'Click link',
      'Click link',
      'Click link',
      'Open attachment',
      'Open attachment',
      'Ignore warning',
    ];

    wrongActions.forEach((action, index) => {
      logInteraction(
        createInteraction({
          isCorrect: false,
          selectedAction: action,
          correctAction: 'Report email',
          timestamp: index + 1,
        })
      );
    });

    const stats = getUserStats();

    expect(stats.commonMistakes[0]).toBe('Click link');
    expect(stats.commonMistakes).toContain('Open attachment');
  });

  test('returns safe defaults when there are no interactions', () => {
    const stats = getUserStats();

    expect(stats).toEqual({
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
  });

  test('handles all-correct and all-incorrect scenarios', () => {
    for (let i = 0; i < 4; i += 1) {
      logInteraction(
        createInteraction({
          isCorrect: true,
          selectedAction: 'Report email',
          correctAction: 'Report email',
          timestamp: i + 1,
        })
      );
    }

    let stats = getUserStats();
    expect(stats.accuracy).toBe(100);

    window.localStorage.clear();

    for (let i = 0; i < 4; i += 1) {
      logInteraction(
        createInteraction({
          isCorrect: false,
          selectedAction: 'Click link',
          correctAction: 'Report email',
          timestamp: i + 10,
        })
      );
    }

    stats = getUserStats();
    expect(stats.accuracy).toBe(0);
  });

  test('ignores invalid inputs safely and does not crash', () => {
    const badInputs = [
      null,
      undefined,
      {},
      { scenarioType: 'phishing' },
      {
        scenarioType: 'phishing',
        difficulty: 'easy',
        isCorrect: true,
        selectedAction: 'Report',
        correctAction: 'Report',
        redFlags: 'not-array',
        timestamp: 1,
      },
    ];

    for (const input of badInputs) {
      logInteraction(input as never);
    }

    const stats = getUserStats();
    expect(stats.totalAttempts).toBe(0);
    expect(stats.correctAttempts).toBe(0);
    expect(stats.accuracy).toBe(0);
  });

  test('returns consistent stats across repeated reads without mutation bugs', () => {
    logInteraction(createInteraction({ isCorrect: true, timestamp: 1 }));
    logInteraction(createInteraction({ isCorrect: false, timestamp: 2 }));

    const first = getUserStats();
    const second = getUserStats();

    expect(second).toEqual(first);
    expect(second).toEqual(
      expect.objectContaining({
        totalAttempts: expect.any(Number),
        correctAttempts: expect.any(Number),
        accuracy: expect.any(Number),
        weakAreas: expect.any(Array),
        byType: expect.any(Object),
      })
    );
  });

  test('handles 100+ interactions correctly (stress case)', () => {
    for (let i = 0; i < 120; i += 1) {
      logInteraction(
        createInteraction({
          scenarioType: i % 2 === 0 ? 'phishing' : 'smishing',
          isCorrect: i % 3 !== 0,
          selectedAction: i % 3 !== 0 ? 'Report email' : 'Click link',
          correctAction: 'Report email',
          timestamp: i + 1,
        })
      );
    }

    const stats = getUserStats();

    expect(stats.totalAttempts).toBe(120);
    expect(stats.correctAttempts).toBe(80);
    expect(stats.accuracy).toBe(67);
    expect(Object.keys(stats.byType).sort()).toEqual(['phishing', 'smishing']);
  });
});
