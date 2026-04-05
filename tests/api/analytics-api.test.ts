import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/server/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/services/user-service', () => ({
  ensureUserExists: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { query } from '@/lib/server/db';
import { ensureUserExists } from '@/lib/services/user-service';
import { GET } from '../../app/api/analytics/route';

const mockedAuth = vi.mocked(auth);
const mockedQuery = vi.mocked(query);
const mockedEnsureUserExists = vi.mocked(ensureUserExists);

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns analytics for authenticated user', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: 'clerk_analytics' } as never);
    mockedEnsureUserExists.mockResolvedValueOnce('db-user-analytics');

    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total_attempts: 12, correct_attempts: 8 }] } as never)
      .mockResolvedValueOnce({
        rows: [
          { scenario_type: 'phishing', attempts: 6, correct: 2 },
          { scenario_type: 'smishing', attempts: 6, correct: 5 },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          { is_correct: true },
          { is_correct: true },
          { is_correct: true },
          { is_correct: true },
          { is_correct: false },
          { is_correct: false },
          { is_correct: false },
          { is_correct: false },
          { is_correct: false },
          { is_correct: true },
        ],
      } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
      })
    );
    expect(body.data).toEqual(
      expect.objectContaining({
        accuracy: 67,
        totalAttempts: 12,
        recentTrend: 'improving',
      })
    );
    expect(body.data.weakAreas).toContain('phishing');
  });

  test('returns 401 for unauthenticated request', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: null } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  test('returns fallback response when DB query fails', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: 'clerk_analytics' } as never);
    mockedEnsureUserExists.mockResolvedValueOnce('db-user-analytics');
    mockedQuery.mockRejectedValueOnce(new Error('db down'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        fallback: true,
        source: 'server-error',
      })
    );
  });

  test('trend is stable when fewer than 10 interactions exist', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: 'clerk_analytics' } as never);
    mockedEnsureUserExists.mockResolvedValueOnce('db-user-analytics');

    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total_attempts: 4, correct_attempts: 2 }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [{ is_correct: true }, { is_correct: false }] } as never);

    const response = await GET();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.recentTrend).toBe('stable');
  });
});
