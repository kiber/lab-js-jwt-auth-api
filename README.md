# lab-js-jwt-auth-api

## API Contract

Base URL: `http://localhost:3000/api/v1`

### Required Environment Variables

- `PORT`
- `API_BASE_PATH` (optional, default `/api/v1`)
- `TRUST_PROXY` (optional, default `false`; set `true` behind reverse proxy)
- `CORS_ORIGIN` (optional, default `http://localhost:5173`)
- `LOG_LEVEL` (optional, default `info`)
- `MONGO_URI`
- `JWT_SECRET` (access token signing secret)
- `JWT_REFRESH_SECRET` (refresh token signing secret)
- `AUTH_LOCKOUT_ENABLED` (optional, default `true`)
- `AUTH_LOCKOUT_MAX_FAILED_ATTEMPTS` (optional, default `5`)
- `AUTH_LOCKOUT_DURATION` (optional, default `15m`)
- `RATE_LIMIT_ENABLED` (optional, default `true`)
- `RATE_LIMIT_STORE` (optional, `memory`, `mongo`, or `redis`, default `memory`)
- `RATE_LIMIT_REDIS_URL` (required when `RATE_LIMIT_STORE=redis`; fallback to `REDIS_URL` if set)
- `RATE_LIMIT_KEY_PREFIX` (optional, default `jwt-auth`)
- `RATE_LIMIT_LOGIN_WINDOW` / `RATE_LIMIT_LOGIN_LIMIT` (optional, default `15m` / `5`)
- `RATE_LIMIT_REGISTER_WINDOW` / `RATE_LIMIT_REGISTER_LIMIT` (optional, default `1h` / `5`)
- `RATE_LIMIT_REFRESH_WINDOW` / `RATE_LIMIT_REFRESH_LIMIT` (optional, default `15m` / `20`)
- `RATE_LIMIT_LOGOUT_WINDOW` / `RATE_LIMIT_LOGOUT_LIMIT` (optional, default `15m` / `20`)
- `RATE_LIMIT_VERIFY_WINDOW` / `RATE_LIMIT_VERIFY_LIMIT` (optional, default `15m` / `30`)

### Response Envelope

Success:

```json
{
  "status": "success",
  "message": "Human-readable message",
  "data": {}
}
```

Error:

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "errors": []
}
```

Notes:
- `data` is optional and only present when endpoint returns payload data.
- `errors` is optional and mainly used for validation failures.

### Authentication

Protected endpoints require:

`Authorization: Bearer <jwt_token>`

### Endpoints

#### `GET /health`

Response `200`:

```json
{
  "status": "success",
  "message": "Service healthy"
}
```

#### `POST /auth/register`

Request body:

```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

Response `201`:

```json
{
  "status": "success",
  "message": "User registered"
}
```

Validation error `400`:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    "email must be a valid email address"
  ]
}
```

Duplicate email `409`:

```json
{
  "status": "error",
  "message": "Email already in use"
}
```

#### `POST /auth/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

Response `200`:

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "access_jwt_token_here",
    "refreshToken": "refresh_jwt_token_here"
  }
}
```

Invalid credentials `401`:

```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

#### `POST /auth/refresh`

Request body:

```json
{
  "refreshToken": "refresh_jwt_token_here"
}
```

Response `200`:

```json
{
  "status": "success",
  "message": "Token refreshed",
  "data": {
    "token": "new_access_jwt_token_here",
    "refreshToken": "new_refresh_jwt_token_here"
  }
}
```

Invalid refresh token `401`:

```json
{
  "status": "error",
  "message": "Invalid refresh token"
}
```

#### `POST /auth/logout`

Request body:

```json
{
  "refreshToken": "refresh_jwt_token_here"
}
```

Response `200`:

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

Invalid refresh token `401`:

```json
{
  "status": "error",
  "message": "Invalid refresh token"
}
```

#### `GET /profile`

Headers:

`Authorization: Bearer <jwt_token>`

Response `200`:

```json
{
  "status": "success",
  "message": "Profile fetched",
  "data": {
    "userId": "mongodb_user_id"
  }
}
```

Missing header `401`:

```json
{
  "status": "error",
  "message": "Authorization header is required"
}
```

Invalid header format `401`:

```json
{
  "status": "error",
  "message": "Authorization header must use Bearer token"
}
```

Invalid/expired token `403`:

```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

### Global Errors

Rate limit exceeded `429`:

```json
{
  "status": "error",
  "message": "Too many requests",
  "errors": [
    "Try again in 60 seconds"
  ]
}
```

Route not found `404`:

```json
{
  "status": "error",
  "message": "Route not found"
}
```

Unhandled server error `500`:

```json
{
  "status": "error",
  "message": "Internal server error"
}
```
