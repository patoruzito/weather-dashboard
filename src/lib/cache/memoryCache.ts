export type CacheEntry<T> = {
  value: T;
  expiresAt?: number;
};

export type CacheHit<T> = {
  value: T;
  ttlSeconds: number;
};

export class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): CacheHit<T> | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const expiresAt = entry.expiresAt;
    if (typeof expiresAt === "number") {
      const remainingMs = expiresAt - Date.now();
      if (remainingMs <= 0) {
        this.store.delete(key);
        return null;
      }
      return {
        value: entry.value,
        ttlSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
      };
    }

    return {
      value: entry.value,
      ttlSeconds: 0,
    };
  }

  set(key: string, value: T, ttlSeconds: number): void {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      this.store.delete(key);
      return;
    }

    const expiresAt = Date.now() + Math.floor(ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
