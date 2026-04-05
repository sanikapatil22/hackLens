import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../lib/ai/scenario-engine', () => ({
  generateScenario: vi.fn(),
}));

import { getScenario } from '../../lib/services/scenario-service';
import { generateScenario } from '../../lib/ai/scenario-engine';

const mockedGenerateScenario = vi.mocked(generateScenario);

const cachedScenario = {
  id: 'cached-1',
  type: 'phishing',
  difficulty: 'easy',
  interface: 'email',
  title: 'Cached Scenario',
  content: 'Suspicious email content',
  options: ['Delete', 'Click link'],
  correct_action: 'Delete',
  red_flags: ['Urgency'],
  explanation: {
    hacker: 'Social engineering lure',
    user: 'Looks suspicious',
    developer: 'Implement anti-phishing controls',
  },
  solution: {
    immediate_action: 'Do not engage',
    prevention_tips: ['Verify sender'],
    best_practices: ['Enable MFA'],
  },
  meta: {
    source: 'cached',
    mode: 'manual',
  },
} as const;

const aiScenario = {
  ...cachedScenario,
  id: 'ai-1',
  meta: {
    source: 'ai',
    mode: 'adaptive',
    difficulty_reason: 'Recent performance improved',
  },
} as const;

describe('scenario-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns scenario successfully in demo mode', async () => {
    mockedGenerateScenario.mockResolvedValueOnce(cachedScenario as never);

    const result = await getScenario({
      mode: 'demo',
      params: { type: 'phishing', difficulty: 'easy' },
    });

    expect(mockedGenerateScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'phishing',
        difficulty: 'easy',
        selectionMode: 'manual',
      }),
      'demo'
    );
    expect(result.meta.source).toBe('cached');
  });

  test('returns AI scenario for live mode when engine resolves AI output', async () => {
    mockedGenerateScenario.mockResolvedValueOnce(aiScenario as never);

    const result = await getScenario({
      mode: 'live',
      adaptive: true,
      params: { type: 'smishing', difficulty: 'hard' },
    });

    expect(result.meta.source).toBe('ai');
    expect(result.meta.mode).toBe('adaptive');
  });

  test('returns cached fallback scenario when engine falls back after AI errors', async () => {
    mockedGenerateScenario.mockResolvedValueOnce(cachedScenario as never);

    const result = await getScenario({
      mode: 'live',
      params: { type: 'impersonation', difficulty: 'medium' },
    });

    expect(result.meta.source).toBe('cached');
  });

  test('always returns solution and meta fields on success', async () => {
    mockedGenerateScenario.mockResolvedValueOnce(cachedScenario as never);

    const result = await getScenario({ mode: 'demo' });

    expect(result.solution).toBeDefined();
    expect(result.solution.immediate_action).toBeTruthy();
    expect(result.solution.prevention_tips.length).toBeGreaterThan(0);
    expect(result.meta).toBeDefined();
    expect(result.meta.source).toBeTruthy();
    expect(result.meta.mode).toBeTruthy();
  });

  test('throws service error when scenario generation fails unexpectedly', async () => {
    mockedGenerateScenario.mockRejectedValueOnce(new Error('engine failure'));

    await expect(getScenario({ mode: 'live' })).rejects.toThrow('Unable to generate scenario');
  });
});
