import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockNextRequest } from '../utils/mock-request';

vi.mock('@/lib/services/scenario-service', () => ({
  getScenario: vi.fn(),
}));

import { getScenario } from '@/lib/services/scenario-service';
import { POST } from '../../app/api/scenario/route';

const mockedGetScenario = vi.mocked(getScenario);

const validScenario = {
  id: 'scenario-1',
  type: 'phishing',
  difficulty: 'easy',
  interface: 'email',
  title: 'Example scenario',
  content: 'Suspicious message',
  options: ['Click', 'Report'],
  correct_action: 'Report',
  red_flags: ['Urgent wording'],
  explanation: {
    hacker: 'Pressure tactic',
    user: 'Looks suspicious',
    developer: 'Use anti-phishing controls',
  },
  solution: {
    immediate_action: 'Report and delete',
    prevention_tips: ['Check sender'],
    best_practices: ['MFA'],
  },
  meta: {
    source: 'cached',
    mode: 'manual',
  },
} as const;

describe('POST /api/scenario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns scenario on valid request', async () => {
    mockedGetScenario.mockResolvedValueOnce(validScenario as never);

    const request = createMockNextRequest('http://localhost/api/scenario', {
      method: 'POST',
      body: {
        mode: 'demo',
        params: { type: 'phishing', difficulty: 'easy' },
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.scenario).toBeDefined();
    expect(body.scenario.solution).toBeDefined();
    expect(body.scenario.meta).toBeDefined();
  });

  test('returns 400 for malformed request payload', async () => {
    const request = createMockNextRequest('http://localhost/api/scenario', {
      method: 'POST',
      body: {
        params: { type: 'invalid-type' },
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid scenario request payload');
  });

  test('returns fallback response when scenario generation fails', async () => {
    mockedGetScenario.mockRejectedValueOnce(new Error('AI down'));

    const request = createMockNextRequest('http://localhost/api/scenario', {
      method: 'POST',
      body: {
        mode: 'live',
        params: { type: 'phishing', difficulty: 'hard' },
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        fallback: true,
      })
    );
  });
});
