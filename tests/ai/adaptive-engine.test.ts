import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/ai/user-tracking', () => ({
  getUserStats: vi.fn(),
}));

import { getAdaptiveParams } from '@/lib/ai/adaptive-engine';
import { getUserStats } from '@/lib/ai/user-tracking';

const mockedGetUserStats = vi.mocked(getUserStats);

describe('adaptive-engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns baseline defaults when no attempts are available', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });

    const params = getAdaptiveParams();

    expect(params).toEqual(
      expect.objectContaining({
        type: 'phishing',
        difficulty: 'medium',
        selectionMode: 'adaptive',
      })
    );
  });

  test('uses easy difficulty when accuracy is below 40', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 8,
      correctAttempts: 2,
      accuracy: 25,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const params = getAdaptiveParams();

    expect(params.difficulty).toBe('easy');
  });

  test('uses medium difficulty when accuracy is between 40 and 70', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 10,
      correctAttempts: 5,
      accuracy: 55,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const params = getAdaptiveParams();

    expect(params.difficulty).toBe('medium');
  });

  test('uses hard difficulty when accuracy is above 70', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 12,
      correctAttempts: 10,
      accuracy: 84,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.3);

    const params = getAdaptiveParams();

    expect(params.difficulty).toBe('hard');
  });

  test('prioritizes explicit weak area type', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 14,
      correctAttempts: 8,
      accuracy: 57,
      byType: {
        phishing: { attempts: 6, correct: 2, accuracy: 33 },
      },
      commonMistakes: [],
      weakAreas: ['phishing'],
    });

    const params = getAdaptiveParams();

    expect(params.type).toBe('phishing');
  });

  test('chooses the weakest type among multiple weak areas', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 20,
      correctAttempts: 10,
      accuracy: 50,
      byType: {
        phishing: { attempts: 10, correct: 4, accuracy: 40 },
        smishing: { attempts: 10, correct: 2, accuracy: 20 },
      },
      commonMistakes: [],
      weakAreas: ['phishing', 'smishing'],
    });

    const params = getAdaptiveParams();

    expect(params.type).toBe('smishing');
    expect(['phishing', 'smishing']).toContain(params.type);
  });

  test('uses random valid type when weak areas are empty', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 6,
      correctAttempts: 3,
      accuracy: 50,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.75);

    const params = getAdaptiveParams();

    expect(['phishing', 'smishing', 'impersonation', 'malware']).toContain(params.type);
    expect(params.type).toBe('malware');
  });

  test('ignores unknown weak area values and falls back to random type', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 9,
      correctAttempts: 4,
      accuracy: 44,
      byType: {},
      commonMistakes: [],
      weakAreas: ['unknown-attack'],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const params = getAdaptiveParams();

    expect(params.type).toBe('phishing');
    expect(params.difficulty).toBe('medium');
  });

  test('handles negative accuracy by selecting easy difficulty', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 3,
      correctAttempts: 0,
      accuracy: -10,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    const params = getAdaptiveParams();

    expect(params.difficulty).toBe('easy');
  });

  test('handles accuracy over 100 by selecting hard difficulty', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 3,
      correctAttempts: 3,
      accuracy: 140,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    const params = getAdaptiveParams();

    expect(params.difficulty).toBe('hard');
  });

  test('handles stats object missing accuracy field without crashing', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 5,
      correctAttempts: 2,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    } as unknown as ReturnType<typeof getUserStats>);
    vi.spyOn(Math, 'random').mockReturnValue(0.25);

    const params = getAdaptiveParams();

    expect(params.type).toBe('smishing');
    expect(params).toEqual(
      expect.objectContaining({
        selectionMode: 'adaptive',
        difficulty: 'hard',
      })
    );
  });

  test('always returns consistent output shape across multiple calls', () => {
    mockedGetUserStats.mockReturnValue({
      totalAttempts: 11,
      correctAttempts: 7,
      accuracy: 64,
      byType: {},
      commonMistakes: [],
      weakAreas: [],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    for (let i = 0; i < 5; i += 1) {
      const params = getAdaptiveParams();
      expect(params).toEqual(
        expect.objectContaining({
          type: expect.any(String),
          difficulty: expect.any(String),
        })
      );
      expect(params.selectionMode).toBe('adaptive');
    }
  });
});
