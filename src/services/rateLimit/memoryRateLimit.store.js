const RateLimitStore = require('./rateLimit.store');

class MemoryRateLimitStore extends RateLimitStore {
  constructor() {
    super();
    this.counters = new Map();
  }

  async increment(key, windowMs) {
    const now = Date.now();
    const existing = this.counters.get(key);

    if (!existing || existing.resetAtMs <= now) {
      const resetAtMs = now + windowMs;
      this.counters.set(key, { count: 1, resetAtMs });
      return {
        count: 1,
        resetAt: new Date(resetAtMs)
      };
    }

    existing.count += 1;
    this.counters.set(key, existing);
    return {
      count: existing.count,
      resetAt: new Date(existing.resetAtMs)
    };
  }
}

module.exports = MemoryRateLimitStore;
