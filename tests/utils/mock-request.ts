import { NextRequest } from 'next/server';

type RequestInitOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export function createMockNextRequest(url: string, options: RequestInitOptions = {}): NextRequest {
  const method = options.method ?? 'GET';
  const hasBody = options.body !== undefined;

  return new NextRequest(url, {
    method,
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
}
