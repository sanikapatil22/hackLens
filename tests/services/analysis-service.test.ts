import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { performLightweightAnalysis } from '@/lib/services/analysis-service';

describe('analysis-service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns structured findings and disclaimer', async () => {
    const headResponse = new Response(null, {
      status: 200,
      headers: {
        'content-type': 'text/html',
        server: 'nginx/1.0',
      },
    });

    const htmlResponse = new Response(
      '<html><body><script>alert(1)</script><form><input type="text" /></form></body></html>',
      {
        status: 200,
        headers: {
          'content-type': 'text/html',
        },
      }
    );

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(headResponse)
      .mockResolvedValueOnce(htmlResponse);

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await performLightweightAnalysis('https://example.com');

    expect(result.analysis_type).toBe('lightweight');
    expect(result.disclaimer).toContain('educational purposes');
    expect(Array.isArray(result.findings)).toBe(true);

    const typedFindings = result.findings.filter(
      (finding) => 'type' in finding && 'severity' in finding && 'confidence' in finding
    );

    expect(typedFindings.length).toBeGreaterThan(0);
    expect(typedFindings[0]).toEqual(
      expect.objectContaining({
        type: expect.any(String),
        severity: expect.any(String),
        confidence: expect.any(String),
      })
    );
  });

  test('handles malformed input safely', async () => {
    await expect(performLightweightAnalysis('://bad-url')).rejects.toThrow('Invalid URL format');
  });

  test('maps unreachable website failures to user-friendly error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ENOTFOUND'));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(performLightweightAnalysis('https://offline.example')).rejects.toThrow(
      'Could not reach this website. It might be offline, blocked, or the domain might not exist.'
    );
  });
});
