# Authentication Setup

This backend supports JWT-based authentication.

## Environment Variables

Add the following environment variables to your `.env` file or environment:

```bash
# JWT Secret (use Rails secret_key_base in production)
JWT_SECRET_KEY=your_jwt_secret_key_here
```

## GraphQL Mutations

### Refresh Token

```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    tokens {
      accessToken
      refreshToken
      tokenType
      expiresIn
    }
    errors {
      message
    }
  }
}
```

## GraphQL Queries

### Current User

```graphql
query CurrentUser {
  currentUser {
    id
    email
    firstName
    lastName
    fullName
    lastSignInAt
    signInCount
  }
}
```

## Usage

1. Implement your preferred authentication method (email/password, OAuth, etc.)
2. Generate JWT tokens using the JwtService
3. Store the returned JWT tokens
4. Include `Authorization: Bearer <access_token>` header in subsequent requests
5. Use `refreshToken` mutation when access token expires

## Database Schema

The `users` table includes:

- Basic user information (email, first_name, last_name)
- Authentication tracking (last_sign_in_at, sign_in_count)

The `drivers` table now has an optional `user_id` foreign key to link drivers to users.
