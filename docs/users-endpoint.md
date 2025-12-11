# Users API Endpoint Documentation

You are building admin GUI elements for managing Users in the OpenAlex system. Below is the complete API documentation for the Users endpoint.

## Overview

Users represent individual accounts in the OpenAlex system. Users can belong to organizations, have API keys, and have various roles (admin, librarian). The admin list endpoint is **admin-only**, while individual users can access their own information.

## Base URL

```
https://api.openalex.org
```

All requests require JWT authentication via the `Authorization: Bearer <token>` header.

---

## Data Model

### User Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, format: `user-XXXXXXXXXXXX` (12-char alphanumeric suffix) |
| `name` | string \| null | User's display name |
| `email` | string | User's email address (unique) |
| `author_id` | string \| null | OpenAlex author ID if user has claimed a profile |
| `is_admin` | boolean | Whether user has admin privileges |
| `is_librarian` | boolean | Whether user has librarian privileges |
| `api_key` | string | User's API key (22-char alphanumeric) |
| `plan` | string \| null | Plan name (e.g., `"1M-daily"`, `"2M-daily"`, `"academic-waiver"`) |
| `api_max_per_day` | integer | Daily API request limit based on plan |
| `plan_expires_at` | string \| null | ISO 8601 timestamp when the plan expires |
| `notes` | string \| null | Admin notes about the user |
| `organization_id` | string \| null | ID of the organization the user belongs to |
| `organization_name` | string \| null | Name of the organization the user belongs to |
| `organization_role` | string \| null | `"owner"` or `"member"` |
| `created` | string | ISO 8601 timestamp of account creation |
| `last_seen` | string \| null | ISO 8601 timestamp of last activity |
| `exports` | Export[] | Array of user's export jobs |

### Example User Object

```json
{
  "id": "user-abc123def456",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "author_id": "https://openalex.org/A1234567890",
  "is_admin": false,
  "is_librarian": false,
  "api_key": "aBcDeFgHiJkLmNoPqRsT12",
  "plan": "1M-daily",
  "api_max_per_day": 1000000,
  "plan_expires_at": "2025-12-31T23:59:59",
  "notes": null,
  "organization_id": "org-xyz789abc123",
  "organization_name": "Massachusetts Institute of Technology",
  "organization_role": "member",
  "created": "2024-03-15T14:30:00",
  "last_seen": "2024-12-09T18:45:00",
  "exports": []
}
```

---

## Endpoints

### 1. List Users (Admin)

**GET** `/users`

List all users with pagination, search, and filtering. **Admin only.**

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query (searches display_name and email) |
| `plan` | string | - | Filter by plan (supports comma-separated values, e.g., `1M-daily,2M-daily`) |
| `organization_id` | string | - | Filter by organization ID |
| `sort` | string | `created` | Sort field: `created`, `plan_expires_at`, `email`, `name`, `display_name`, `plan` |
| `desc` | boolean | `true` | Sort descending if true, ascending if false |
| `page` | integer | 1 | Page number |
| `per_page` | integer | 25 | Results per page (max 100) |

#### Response

```json
{
  "meta": {
    "count": 25,
    "total_count": 1547,
    "page": 1,
    "per_page": 25,
    "total_pages": 62,
    "query": "smith",
    "plan": null,
    "organization_id": null,
    "sort": "created",
    "desc": true,
    "elapsed_seconds": 0.045
  },
  "results": [
    {
      "id": "user-abc123def456",
      "name": "Jane Smith",
      "email": "jane@example.com",
      ...
    }
  ]
}
```

#### Example Requests

```bash
# List all users
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users"

# Search for users containing "smith"
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users?q=smith&page=1&per_page=10"

# Filter by plan
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users?plan=1M-daily,2M-daily"

# Filter by organization
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users?organization_id=org-abc123def456&sort=created&desc=true"
```

#### Error Responses

| Status | Message |
|--------|---------|
| 403 | "You must be an admin to access this endpoint." |

---

### 2. Get Current User

**GET** `/users/me`

Get the currently authenticated user's information. **Requires authentication.**

#### Response

Returns the authenticated User object.

#### Example Request

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users/me"
```

#### Error Responses

| Status | Message |
|--------|---------|
| 401 | "Must be logged in." |

---

### 3. Get User by ID

**GET** `/users/<user_id>`

Get a specific user by ID. **Accessible to the user themselves or admins.**

#### Response

Returns the User object.

#### Example Request

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users/user-abc123def456"
```

#### Error Responses

| Status | Message |
|--------|---------|
| 401 | "Must be logged in." |
| 403 | "Not authorized to view this user." |
| 404 | "User user-xxx not found." |

---

### 4. Register New User

**POST** `/users/<user_id>`

Create a new user account. **Public endpoint.**

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | Password (minimum 5 characters) |
| `display_name` | string | No | User's display name |
| `is_librarian` | boolean | No | Whether user is a librarian (default: false) |
| `author_id` | string | No | OpenAlex author ID to claim |

#### Example Request

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "display_name": "New User"
  }' \
  "https://api.openalex.org/users/user-newid123456"
```

#### Response (201 Created)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-newid123456",
    "name": "New User",
    "email": "newuser@example.com",
    ...
  }
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "This post requires JSON data." |
| 400 | "Email parameter is required." |
| 400 | "Password parameter is required." |
| 400 | "Password must be at least 5 characters." |
| 400 | "Author xxx not found in the OpenAlex API." |
| 409 | "A user with email xxx already exists." |
| 409 | "A user with id xxx already exists." |

---

### 5. Admin Create User

**POST** `/admin/users`

Create a new user. **Admin only.**

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `display_name` | string | Yes | User's display name |
| `organization_id` | string | No | Organization ID to assign user to |
| `organization_role` | string | No | `"owner"` or `"member"` |

#### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "display_name": "New User",
    "organization_id": "org-xyz789abc123",
    "organization_role": "member"
  }' \
  "https://api.openalex.org/admin/users"
```

#### Response (201 Created)

Returns the new User object.

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "This endpoint requires JSON data." |
| 400 | "email is required." |
| 400 | "display_name is required." |
| 403 | "You must be an admin to access this endpoint." |
| 409 | "A user with email xxx already exists." |

---

### 6. Delete User

**DELETE** `/users/<user_id>`

Delete a user. **Admin only.**

#### Example Request

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users/user-abc123def456"
```

#### Response

```json
{
  "deleted_user_id": "user-abc123def456"
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 403 | "You must be an admin to access this endpoint." |
| 404 | "User user-xxx not found." |

---

### 7. Admin Update User

**POST** or **PATCH** `/admin/users/<user_id>`

Update a user's information. **Admin only.** Only include fields you want to update.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| `display_name` | string | New display name |
| `email` | string | New email address |
| `author_id` | string | OpenAlex author ID |
| `is_admin` | boolean | Admin status |
| `is_librarian` | boolean | Librarian status |
| `plan` | string | Plan name |
| `plan_expires_at` | string | ISO 8601 datetime when plan expires |
| `notes` | string | Admin notes |
| `organization_id` | string \| null | Organization ID (send null to remove from org) |
| `organization_role` | string \| null | `"owner"` or `"member"` (send null to clear) |

#### Example Requests

```bash
# Update plan
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "1M-daily",
    "plan_expires_at": "2025-12-31T23:59:59",
    "notes": "Premium customer"
  }' \
  https://api.openalex.org/admin/users/user-abc123def456

# Add user to an organization
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-xyz789abc123",
    "organization_role": "member"
  }' \
  "https://api.openalex.org/admin/users/user-abc123def456"

# Remove user from organization
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": null,
    "organization_role": null
  }' \
  "https://api.openalex.org/admin/users/user-abc123def456"
```

#### Response

Returns the updated User object.

#### Error Responses

| Status | Message |
|--------|---------|
| 403 | "You must be an admin to access this endpoint." |
| 404 | "User not found." |

---

## Authentication Endpoints

### 8. User Login

**POST** `/users/login`

Authenticate with email and password.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

#### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "email parameter is required" |
| 400 | "password parameter is required" |
| 403 | "Bad password." |
| 404 | "User does not exist." |

---

### 9. Magic Login Request

**POST** `/users/magic-login-request`

Request a magic login link sent via email.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `display_name` | string | No | If provided, creates a new account (signup) |
| `localhost` | string | No | Port number for local development redirects |

#### Response

```json
{
  "message": "Email sent"
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "email parameter is required" |
| 404 | "User does not exist." (login without display_name) |
| 409 | "A user with email xxx already exists." (signup with display_name) |
| 429 | "Too many login requests. Please try again later." |

---

### 10. Magic Login

**POST** `/users/magic-login`

Complete magic login with token from email.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Token from magic login email |

#### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-abc123def456",
    "email": "user@example.com",
    "name": "User Name",
    "is_admin": false,
    "is_librarian": false,
    "author_id": null
  }
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "token parameter is required" |
| 401 | "Invalid or expired login token." |
| 401 | "Login token has expired. Please request a new one." |
| 401 | "Login token has already been used." |

---

## Password Reset Endpoints

### 11. Request Password Reset

**POST** `/password/request-reset`

Request a password reset email.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | One required | User's email address |
| `user_id` | string | One required | User's ID |

#### Response

```json
{
  "message": "received reset request for user@example.com"
}
```

---

### 12. Reset Password

**POST** `/password/reset`

Complete password reset with token.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Token from reset email |
| `password` | string | Yes | New password |

#### Response

```json
{
  "message": "reset password for user@example.com"
}
```

---

## Authorization Summary

| Endpoint | Admin | User (self) | User (other) | Public |
|----------|-------|-------------|--------------|--------|
| List users (`/users`) | ✅ | ❌ | ❌ | ❌ |
| Get current user (`/users/me`) | ✅ | ✅ | - | ❌ |
| Get user by ID | ✅ | ✅ | ❌ | ❌ |
| Register new user | - | - | - | ✅ |
| Admin create user | ✅ | ❌ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ | ❌ |
| Admin update user | ✅ | ❌ | ❌ | ❌ |
| Login | - | - | - | ✅ |
| Magic login | - | - | - | ✅ |
| Password reset | - | - | - | ✅ |

---

## GUI Implementation Notes

1. **Admin User List**: Create a searchable, paginated table showing email, name, plan, organization, created date, and last seen.

2. **Filters**: 
   - Search box for name/email (`q` parameter)
   - Plan dropdown/multi-select (`plan` parameter)
   - Organization dropdown (`organization_id` parameter)

3. **Sorting**: Allow sorting by created date, plan expiration, email, name, and plan.

4. **User Detail View**: Show full user details including organization membership, exports, and admin notes.

5. **Admin Edit Form**:
   - Display name, email fields
   - Plan dropdown with expiration date picker
   - Admin/librarian checkboxes
   - Notes textarea

6. **Organization Link**: When viewing users filtered by organization, provide a link back to the organization detail view.
