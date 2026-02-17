const RateLimitStore = require('./rateLimit.store');

class RedisRateLimitStore extends RateLimitStore {
  constructor({ redisUrl }) {
    super();

    if (!redisUrl) {
      throw new Error('RATE_LIMIT_REDIS_URL (or REDIS_URL) is required when RATE_LIMIT_STORE=redis');
    }

    this.redisUrl = redisUrl;
    this.client = null;
    this.connectingPromise = null;
  }

  async ensureClient() {
    if (this.client && this.client.isOpen) return this.client;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = (async () => {
      let createClient;
      try {
        ({ createClient } = require('redis'));
      } catch {
        throw new Error(
          'Redis rate limit store selected but `redis` package is not installed. Run: npm install redis'
        );
      }

      this.client = createClient({ url: this.redisUrl });
      await this.client.connect();
      return this.client;
    })();

    try {
      return await this.connectingPromise;
    } finally {
      this.connectingPromise = null;
    }
  }

  async increment(key, windowMs) {
    const client = await this.ensureClient();

    const script = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('PEXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('PTTL', KEYS[1])
      return { current, ttl }
    `;

    const [countRaw, ttlRaw] = await client.eval(script, {
      keys: [key],
      arguments: [String(windowMs)]
    });

    const count = Number(countRaw);
    const ttlMs = Number(ttlRaw) > 0 ? Number(ttlRaw) : windowMs;

    return {
      count,
      resetAt: new Date(Date.now() + ttlMs)
    };
  }
}

module.exports = RedisRateLimitStore;
