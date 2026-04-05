const globalCache = new Map<string, unknown>();

export function getCache<T>(key: string): T | null {
  if (!globalCache.has(key)) {
    return null;
  }

  return globalCache.get(key) as T;
}

export function setCache<T>(key: string, value: T): void {
  globalCache.set(key, value);
}
