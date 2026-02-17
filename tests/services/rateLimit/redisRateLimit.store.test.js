describe('RedisRateLimitStore', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('throws when redis url is missing', () => {
    const RedisRateLimitStore = require('../../../src/services/rateLimit/redisRateLimit.store');

    expect(() => new RedisRateLimitStore({ redisUrl: '' })).toThrow(
      'RATE_LIMIT_REDIS_URL (or REDIS_URL) is required when RATE_LIMIT_STORE=redis'
    );
  });

  test('increments and returns count/resetAt using redis eval', async () => {
    const evalMock = jest.fn().mockResolvedValue([3, 12000]);
    const connectMock = jest.fn().mockResolvedValue(undefined);

    jest.doMock(
      'redis',
      () => ({
        createClient: () => ({
          isOpen: false,
          connect: connectMock,
          eval: evalMock
        })
      }),
      { virtual: true }
    );

    const RedisRateLimitStore = require('../../../src/services/rateLimit/redisRateLimit.store');
    const store = new RedisRateLimitStore({ redisUrl: 'redis://localhost:6379' });

    const result = await store.increment('my-key', 15000);

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(evalMock).toHaveBeenCalledWith(expect.any(String), {
      keys: ['my-key'],
      arguments: ['15000']
    });
    expect(result.count).toBe(3);
    expect(result.resetAt).toBeInstanceOf(Date);
  });
});
