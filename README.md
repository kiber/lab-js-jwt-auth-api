# lab-js-jwt-auth-api

## API Contract

Base URL: `http://localhost:3000`

### Required Environment Variables

- `PORT`
- `MONGO_URI`
- `JWT_SECRET` (access token signing secret)
- `JWT_REFRESH_SECRET` (refresh token signing secret)

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
