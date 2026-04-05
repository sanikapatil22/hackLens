import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { ScenarioParams } from '@/lib/ai/scenario-types';
import { generateBasicSolution, generateScenarioWithLLM } from '@/lib/server/llm-client';

const BASE_PARAMS: ScenarioParams = {
  type: 'phishing',
  difficulty: 'easy',
};

function paramsFor(testCase: string): ScenarioParams {
  return {
    ...BASE_PARAMS,
    context: testCase,
  };
}

function buildValidScenarioPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'llm-scenario-1',
    type: 'phishing',
    difficulty: 'easy',
    interface: 'email',
    title: 'Suspicious invoice message',
    content: 'You receive an urgent invoice email asking for immediate action.',
    options: ['Open attachment immediately', 'Verify sender and report'],
    correct_action: 'Verify sender and report',
    red_flags: ['Urgent tone', 'Unknown sender'],
    explanation: {
      hacker: 'Creates urgency to bypass careful review.',
      user: 'Verify source before interacting with links/attachments.',
      developer: 'Apply anti-phishing checks and awareness controls.',
    },
    solution: {
      immediate_action: 'Do not open the attachment. Report the email.',
      prevention_tips: ['Check sender domain'],
      best_practices: ['Use phishing-resistant MFA'],
    },
    ...overrides,
  };
}

function buildOpenAIResponseFromScenario(scenarioPayload: Record<string, unknown>) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify(scenarioPayload),
        },
      },
    ],
  };
}

describe('server llm-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  test('returns valid scenario object for successful API response', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(buildOpenAIResponseFromScenario(buildValidScenarioPayload())), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const scenario = await generateScenarioWithLLM(paramsFor('success'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(scenario).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: 'phishing',
        difficulty: 'easy',
        content: expect.any(String),
        options: expect.any(Array),
        solution: expect.any(Object),
        meta: expect.objectContaining({ source: 'ai', mode: 'manual' }),
      })
    );
    expect(scenario.options.length).toBeGreaterThanOrEqual(2);
    expect(scenario.solution.immediate_action.length).toBeGreaterThan(0);
  });

  test('throws when API returns non-200 response (caller can fallback)', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(new Response('failure', { status: 500 }));

    await expect(generateScenarioWithLLM(paramsFor('api-failure'))).rejects.toThrow('OpenAI request failed with status 500.');
  });

  test('throws when API response contains invalid JSON content block', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{ not-json' } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    await expect(generateScenarioWithLLM(paramsFor('invalid-json'))).rejects.toThrow(
      'Failed to parse scenario JSON from LLM response.'
    );
  });

  test('aborts on timeout and rejects when request hangs', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockImplementationOnce((_, init) => {
      const signal = init?.signal as AbortSignal;
      return new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      }) as Promise<Response>;
    });

    const settled = generateScenarioWithLLM(paramsFor('timeout'))
      .then((value) => ({ ok: true as const, value }))
      .catch((error: unknown) => ({ ok: false as const, error }));

    await vi.advanceTimersByTimeAsync(5000);

    const result = await settled;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('aborted');
    }

    vi.useRealTimers();
  });

  test('uses generated fallback solution when LLM omits solution', async () => {
    const fetchMock = vi.mocked(global.fetch);
    const payloadWithoutSolution = buildValidScenarioPayload();
    delete (payloadWithoutSolution as Partial<typeof payloadWithoutSolution>).solution;

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(buildOpenAIResponseFromScenario(payloadWithoutSolution)), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const scenario = await generateScenarioWithLLM(paramsFor('missing-solution'));

    expect(scenario.solution).toEqual(generateBasicSolution('phishing'));
  });

  test('throws when required fields like options are missing', async () => {
    const fetchMock = vi.mocked(global.fetch);
    const payloadMissingOptions = buildValidScenarioPayload();
    delete (payloadMissingOptions as Partial<typeof payloadMissingOptions>).options;

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(buildOpenAIResponseFromScenario(payloadMissingOptions)), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(generateScenarioWithLLM(paramsFor('missing-options'))).rejects.toThrow('Invalid scenario options.');
  });

  test('uses cache: second call with same params avoids fetch', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(buildOpenAIResponseFromScenario(buildValidScenarioPayload({ id: 'cached-llm-id' }))), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const cacheParams = paramsFor('cache-hit');
    const first = await generateScenarioWithLLM(cacheParams);
    const second = await generateScenarioWithLLM(cacheParams);

    expect(first.id).toBe('cached-llm-id');
    expect(second.id).toBe('cached-llm-id');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('throws for empty API response content', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(generateScenarioWithLLM(paramsFor('empty-content'))).rejects.toThrow(
      'OpenAI response did not include content.'
    );
  });

  test('throws for unexpected response structure (no choices)', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ foo: 'bar' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(generateScenarioWithLLM(paramsFor('unexpected-structure'))).rejects.toThrow(
      'OpenAI response did not include content.'
    );
  });

  test('throws when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(generateScenarioWithLLM(paramsFor('missing-api-key'))).rejects.toThrow('Missing OPENAI_API_KEY.');
  });
});
