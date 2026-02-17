jest.mock('../../src/services/rateLimit', () => ({
  getRateLimitStore: jest.fn()
}));

const { getRateLimitStore } = require('../../src/services/rateLimit');
const {
  createRateLimitMiddleware,
  keyGenerators
} = require('../../src/middleware/rateLimit.middleware');

const makeRes = () => {
  const headers = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn((key, value) => {
      headers[key] = value;
    })
  };

  return { res, headers };
};

describe('rateLimit.middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows requests under limit and sets headers', async () => {
    const increment = jest.fn().mockResolvedValue({
      count: 1,
      resetAt: new Date(Date.now() + 10_000)
    });
    getRateLimitStore.mockReturnValue({ increment });

    const middleware = createRateLimitMiddleware({
      scope: 'auth:login',
      limit: 5,
      windowMs: 15_000,
      keyGenerator: keyGenerators.ipAndEmail
    });

    const req = {
      ip: '127.0.0.1',
      body: { email: 'John@Example.com' }
    };
    const { res, headers } = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(increment).toHaveBeenCalledWith(
      expect.stringContaining('auth:login:127.0.0.1:john@example.com'),
      15_000
    );
    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('4');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blocks requests over limit with 429 and retry header', async () => {
    const increment = jest.fn().mockResolvedValue({
      count: 6,
      resetAt: new Date(Date.now() + 12_000)
    });
    getRateLimitStore.mockReturnValue({ increment });

    const middleware = createRateLimitMiddleware({
      scope: 'auth:login',
      limit: 5,
      windowMs: 15_000
    });

    const req = {
      ip: '127.0.0.1',
      body: {}
    };
    const { res, headers } = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(headers['Retry-After']).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Too many requests',
      errors: [expect.stringContaining('Try again in')]
    });
  });
});
