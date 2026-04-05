import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockNextRequest } from '../utils/mock-request';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/user-service', () => ({
  ensureUserExists: vi.fn(),
  getUserStatsDB: vi.fn(),
  logInteractionDB: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { ensureUserExists, getUserStatsDB, logInteractionDB } from '@/lib/services/user-service';
import { GET, POST } from '../../app/api/user/route';

const mockedAuth = vi.mocked(auth);
const mockedEnsureUserExists = vi.mocked(ensureUserExists);
const mockedGetUserStatsDB = vi.mocked(getUserStatsDB);
const mockedLogInteractionDB = vi.mocked(logInteractionDB);

describe('/api/user route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('POST guest request returns success with fallback when DB write fails', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: null } as never);
    mockedLogInteractionDB.mockRejectedValueOnce(new Error('db unavailable'));

    const request = createMockNextRequest('http://localhost/api/user', {
      method: 'POST',
      body: {
        userId: 'anon-1',
        scenarioType: 'phishing',
        difficulty: 'easy',
        isCorrect: false,
        selectedAction: 'Click link',
        correctAction: 'Report',
        redFlags: ['Urgency'],
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        fallback: true,
        source: 'client',
      })
    );
  });

  test('POST authenticated request returns DB success', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: 'clerk_123' } as never);
    mockedEnsureUserExists.mockResolvedValueOnce('db-user-1');
    mockedLogInteractionDB.mockResolvedValueOnce();

    const request = createMockNextRequest('http://localhost/api/user', {
      method: 'POST',
      body: {
        scenarioType: 'smishing',
        difficulty: 'medium',
        isCorrect: true,
        selectedAction: 'Report',
        correctAction: 'Report',
        redFlags: ['Unknown sender'],
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockedEnsureUserExists).toHaveBeenCalledWith('clerk_123');
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        fallback: false,
        source: 'db',
      })
    );
  });

  test('GET authenticated request returns stats', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: 'clerk_999' } as never);
    mockedEnsureUserExists.mockResolvedValueOnce('db-user-2');
    mockedGetUserStatsDB.mockResolvedValueOnce({
      totalAttempts: 10,
      correctAttempts: 7,
      accuracy: 70,
      byType: {},
      commonMistakes: [],
      weakAreas: ['phishing'],
    });

    const request = createMockNextRequest('http://localhost/api/user', { method: 'GET' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        fallback: false,
        source: 'db',
      })
    );
    expect(body.stats.accuracy).toBe(70);
  });

  test('GET unauthenticated request returns 401', async () => {
    mockedAuth.mockResolvedValueOnce({ userId: null } as never);

    const request = createMockNextRequest('http://localhost/api/user', { method: 'GET' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });
});
