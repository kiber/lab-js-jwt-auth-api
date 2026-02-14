const crypto = require('crypto');

jest.mock('../../src/models/User', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

const User = require('../../src/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth } = require('../../src/config/app.config');
const {
  register,
  login,
  refresh,
  logout,
  verify
} = require('../../src/controllers/auth.controller');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

describe('auth.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('hashes password and creates user', async () => {
      const req = { body: { email: 'john@example.com', password: 'secret123' } };
      const res = makeRes();

      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockResolvedValue({ _id: 'user-1' });

      await register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', auth.bcryptSaltRounds);
      expect(User.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'hashed-password'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User registered'
      });
      const payload = res.json.mock.calls[0][0];
      expect(payload).not.toHaveProperty('data');
    });

    test('rejects when user creation fails with a generic db error', async () => {
      const req = { body: { email: 'john@example.com', password: 'secret123' } };
      const res = makeRes();
      const dbError = new Error('db write failed');

      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockRejectedValue(dbError);

      await expect(register(req, res)).rejects.toThrow('db write failed');
      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', auth.bcryptSaltRounds);
      expect(User.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'hashed-password'
      });
    });

    test('rejects when user creation fails with duplicate email error', async () => {
      const req = { body: { email: 'john@example.com', password: 'secret123' } };
      const res = makeRes();
      const duplicateKeyError = Object.assign(new Error('duplicate key error'), {
        code: 11000,
        keyPattern: { email: 1 }
      });

      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockRejectedValue(duplicateKeyError);

      await expect(register(req, res)).rejects.toMatchObject({
        code: 11000
      });
      expect(User.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'hashed-password'
      });
    });

    test('rejects when request body is missing', async () => {
      const req = {};
      const res = makeRes();

      await expect(register(req, res)).rejects.toThrow();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    test('attempts register with undefined email when middleware contract is bypassed', async () => {
      const req = { body: { password: 'secret123' } };
      const res = makeRes();

      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockResolvedValue({ _id: 'user-1' });

      await register(req, res);

      expect(User.create).toHaveBeenCalledWith({
        email: undefined,
        password: 'hashed-password'
      });
    });

    test('attempts register with undefined password when middleware contract is bypassed', async () => {
      const req = { body: { email: 'john@example.com' } };
      const res = makeRes();

      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockResolvedValue({ _id: 'user-1' });

      await register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith(undefined, auth.bcryptSaltRounds);
      expect(User.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'hashed-password'
      });
    });
  });

  describe('login', () => {
    test('returns 401 when user is not found', async () => {
      const req = { body: { email: 'john@example.com', password: 'secret123' } };
      const res = makeRes();

      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid credentials'
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('returns 401 when password is invalid', async () => {
      const req = { body: { email: 'john@example.com', password: 'wrong-pass' } };
      const res = makeRes();
      const user = { password: 'stored-hash' };

      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-pass', 'stored-hash');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid credentials'
      });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test('returns access and refresh tokens when credentials are valid', async () => {
      const req = { body: { email: 'john@example.com', password: 'secret123' } };
      const res = makeRes();
      const user = {
        _id: 'user-1',
        password: 'stored-hash',
        refreshTokenHash: null,
        save: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await login(req, res);

      expect(jwt.sign).toHaveBeenNthCalledWith(1, { userId: 'user-1' }, auth.jwtSecret, {
        expiresIn: auth.accessTokenTtl
      });
      expect(jwt.sign).toHaveBeenNthCalledWith(2, { userId: 'user-1' }, auth.jwtRefreshSecret, {
        expiresIn: auth.refreshTokenTtl
      });
      expect(user.refreshTokenHash).toBe(sha256('refresh-token'));
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Login successful',
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token'
        }
      });
    });
  });

  describe('refresh', () => {
    test('returns 401 when jwt verification fails', async () => {
      const req = { body: { refreshToken: 'invalid-token' } };
      const res = makeRes();

      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid refresh token'
      });
      expect(User.findById).not.toHaveBeenCalled();
    });

    test('returns 401 when user does not exist', async () => {
      const req = { body: { refreshToken: 'refresh-token' } };
      const res = makeRes();

      jwt.verify.mockReturnValue({ userId: 'user-1' });
      User.findById.mockResolvedValue(null);

      await refresh(req, res);

      expect(User.findById).toHaveBeenCalledWith('user-1');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid refresh token'
      });
    });

    test('returns 401 when refresh token hash does not match', async () => {
      const req = { body: { refreshToken: 'refresh-token' } };
      const res = makeRes();
      const user = {
        _id: 'user-1',
        refreshTokenHash: 'different-hash',
        save: jest.fn()
      };

      jwt.verify.mockReturnValue({ userId: 'user-1' });
      User.findById.mockResolvedValue(user);

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid refresh token'
      });
      expect(user.save).not.toHaveBeenCalled();
    });

    test('returns rotated tokens when refresh token is valid', async () => {
      const incomingRefreshToken = 'refresh-token';
      const req = { body: { refreshToken: incomingRefreshToken } };
      const res = makeRes();
      const user = {
        _id: 'user-1',
        refreshTokenHash: sha256(incomingRefreshToken),
        save: jest.fn().mockResolvedValue(undefined)
      };

      jwt.verify.mockReturnValue({ userId: 'user-1' });
      User.findById.mockResolvedValue(user);
      jwt.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      await refresh(req, res);

      expect(user.refreshTokenHash).toBe(sha256('new-refresh-token'));
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Token refreshed',
        data: {
          token: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      });
    });
  });

  describe('logout', () => {
    test('returns 401 when jwt verification fails', async () => {
      const req = { body: { refreshToken: 'invalid-token' } };
      const res = makeRes();

      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid refresh token'
      });
    });

    test('returns 401 when user refresh hash is missing', async () => {
      const req = { body: { refreshToken: 'refresh-token' } };
      const res = makeRes();

      jwt.verify.mockReturnValue({ userId: 'user-1' });
      User.findById.mockResolvedValue({ _id: 'user-1', refreshTokenHash: null });

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid refresh token'
      });
    });

    test('returns 401 when refresh token hash does not match', async () => {
      const req = { body: { refreshToken: 'refresh-token' } };
      const res = makeRes();
      const user = {
        _id: 'user-1',
        refreshTokenHash: 'different-hash',
        save: jest.fn()
      };

      jwt.verify.mockReturnValue({ userId: 'user-1' });
      User.findById.mockResolvedValue(user);

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid refresh token'
      });
      expect(user.save).not.toHaveBeenCalled();
    });

    test('clears refresh token hash and returns success when token is valid', async () => {
      const incomingRefreshToken = 'refresh-token';
      const req = { body: { refreshToken: incomingRefreshToken } };
      const res = makeRes();
      const user = {
        _id: 'user-1',
        refreshTokenHash: sha256(incomingRefreshToken),
        save: jest.fn().mockResolvedValue(undefined)
      };

      jwt.verify.mockReturnValue({ userId: 'user-1' });
      User.findById.mockResolvedValue(user);

      await logout(req, res);

      expect(user.refreshTokenHash).toBeNull();
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Logged out successfully'
      });
    });
  });

  describe('verify', () => {
    test('returns 401 when authorization header is missing', async () => {
      const req = { headers: {} };
      const res = makeRes();

      await verify(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Authorization header is required'
      });
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('returns 401 when authorization header is not bearer token', async () => {
      const req = { headers: { authorization: 'Token access-token' } };
      const res = makeRes();

      await verify(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Authorization header must use Bearer token'
      });
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('returns 401 when jwt verification fails', async () => {
      const req = { headers: { authorization: 'Bearer invalid-token' } };
      const res = makeRes();

      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await verify(req, res);

      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', auth.jwtSecret);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid token'
      });
    });

    test('returns valid true and userId when token is valid', async () => {
      const req = { headers: { authorization: 'Bearer access-token' } };
      const res = makeRes();

      jwt.verify.mockReturnValue({ userId: 'user-1' });

      await verify(req, res);

      expect(jwt.verify).toHaveBeenCalledWith('access-token', auth.jwtSecret);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Token is valid',
        data: {
          valid: true,
          userId: 'user-1'
        }
      });
    });
  });
});
