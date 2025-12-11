# Organizations API Endpoint Documentation

You are building admin GUI elements for managing Organizations in the OpenAlex system. Below is the complete API documentation for the Organizations endpoint.

## Overview

Organizations represent institutional entities (universities, companies, etc.) that can have multiple user members. Each organization has owners and members. This is an **admin-only** feature set, except that organization owners can view their own organization.


## Base URL

```
https://api.openalex.org
```

All requests require JWT authentication via the `Authorization: Bearer <token>` header.

---

## Data Model

### Organization Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, format: `org-XXXXXXXXXXXX` (12-char alphanumeric suffix) |
| `name` | string | Organization name (required) |
| `domains` | string[] | Array of email domains associated with this org (e.g., `["mit.edu", "media.mit.edu"]`) |
| `ror_id` | string \| null | ROR (Research Organization Registry) identifier |
| `created` | string | ISO 8601 timestamp of creation |
| `api_keys` | string[] | Array of API keys associated with this organization |
| `plan` | string \| null | Plan name (e.g., `"1M-daily"`, `"2M-daily"`, `"academic-waiver"`) |
| `api_max_per_day` | integer | Daily API request limit based on plan (computed from plan config) |
| `plan_expires_at` | string \| null | ISO 8601 timestamp when the plan expires |
| `members` | Member[] | Array of member objects |

### Member Object (nested in Organization)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User ID |
| `email` | string | User's email address |
| `display_name` | string \| null | User's display name |
| `organization_role` | string | Either `"owner"` or `"member"` |

### Example Organization Object

```json
{
  "id": "org-abc123def456",
  "name": "Massachusetts Institute of Technology",
  "domains": ["mit.edu", "media.mit.edu"],
  "ror_id": "https://ror.org/042nb2s44",
  "created": "2024-03-15T14:30:00",
  "api_keys": ["openalex_abc123", "openalex_def456"],
  "plan": "2M-daily",
  "api_max_per_day": 2000000,
  "plan_expires_at": "2025-12-31T23:59:59",
  "members": [
    {
      "id": "user-xyz789",
      "email": "admin@mit.edu",
      "display_name": "Jane Smith",
      "organization_role": "owner"
    },
    {
      "id": "user-abc123",
      "email": "researcher@mit.edu",
      "display_name": "John Doe",
      "organization_role": "member"
    }
  ]
}
```

---

## Endpoints

### 1. List Organizations

**GET** `/organizations`

List all organizations with pagination and search. **Admin only.**

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query (searches name and domains) |
| `plan` | string | - | Filter by plan (supports comma-separated values, e.g., `1M-daily,2M-daily`) |
| `sort` | string | `created` | Sort field: `created` or `member_count` |
| `desc` | boolean | `true` | Sort descending if true, ascending if false |
| `page` | integer | 1 | Page number |
| `per_page` | integer | 25 | Results per page |

#### Response

```json
{
  "meta": {
    "count": 2,
    "total_count": 47,
    "page": 1,
    "per_page": 25,
    "total_pages": 2,
    "query": "university",
    "plan": null,
    "sort": "created",
    "desc": true
  },
  "results": [
    {
      "id": "org-abc123def456",
      "name": "Massachusetts Institute of Technology",
      "domains": ["mit.edu"],
      "ror_id": "https://ror.org/042nb2s44",
      "created": "2024-03-15T14:30:00",
      "members": [...]
    }
  ]
}
```

#### Example Request

```bash
# List all organizations
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/organizations"

# Search for organizations containing "university"
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/organizations?q=university&page=1&per_page=10"

# Filter by plan
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/organizations?plan=1M-daily,2M-daily"
```

---

### 2. Get Single Organization

**GET** `/organizations/<organization_id>`

Get details of a specific organization. **Admin or organization owner only.**

#### Response

Returns a single Organization object.

#### Example Request

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/organizations/org-abc123def456"
```

#### Error Responses

| Status | Message |
|--------|---------|
| 401 | "Must be logged in." |
| 403 | "Not authorized to view this organization." |
| 404 | "Organization org-xxx not found." |

---

### 3. Create Organization

**POST** `/organizations`

Create a new organization. **Admin only.**

**Note:** If `api_keys` is not provided or is empty, a new API key will be automatically generated for the organization.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Organization name |
| `domains` | string \| string[] | No | Email domain(s). Can be comma-separated string or array |
| `ror_id` | string | No | ROR identifier |
| `api_keys` | string[] | No | Array of API keys. If not provided, one will be auto-generated |
| `plan` | string | No | Plan name (e.g., `"1M-daily"`, `"2M-daily"`, `"academic-waiver"`) |
| `plan_expires_at` | string | No | ISO 8601 datetime when plan expires |

#### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stanford University",
    "domains": ["stanford.edu", "cs.stanford.edu"],
    "ror_id": "https://ror.org/00f54p054",
    "plan": "1M-daily",
    "plan_expires_at": "2025-12-31T23:59:59"
  }' \
  "https://api.openalex.org/organizations"
```

#### Response (201 Created)

```json
{
  "id": "org-newid123456",
  "name": "Stanford University",
  "domains": ["stanford.edu", "cs.stanford.edu"],
  "ror_id": "https://ror.org/00f54p054",
  "created": "2024-12-09T20:30:00",
  "api_keys": ["aBcDeFgHiJkLmNoPqRsT12"],
  "plan": "1M-daily",
  "api_max_per_day": 1000000,
  "plan_expires_at": "2025-12-31T23:59:59",
  "members": []
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "This endpoint requires JSON data." |
| 400 | "name is required." |
| 400 | "api_keys must be an array of strings." |
| 400 | "plan_expires_at must be a valid ISO 8601 datetime string." |
| 403 | "You must be an admin to access this endpoint." |

---

### 4. Update Organization

**PATCH** `/organizations/<organization_id>`

Update an existing organization. **Admin only.** Only include fields you want to update.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | New organization name |
| `domains` | string \| string[] | New domain(s) |
| `ror_id` | string \| null | New ROR ID (send null to clear) |
| `api_keys` | string[] | Array of API keys (replaces existing keys) |
| `plan` | string \| null | Plan name (e.g., `"1M-daily"`, `"2M-daily"`, `"academic-waiver"`) |
| `plan_expires_at` | string \| null | ISO 8601 datetime when plan expires (send null to clear) |

#### Example Request

```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stanford University (Updated)",
    "domains": ["stanford.edu"],
    "api_keys": ["openalex_key123"],
    "plan": "1M-daily",
    "plan_expires_at": "2025-12-31T23:59:59"
  }' \
  "https://api.openalex.org/organizations/org-abc123def456"
```

#### Response

Returns the updated Organization object.

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "This endpoint requires JSON data." |
| 400 | "name cannot be empty." |
| 400 | "api_keys must be an array of strings." |
| 400 | "plan_expires_at must be a valid ISO 8601 datetime string." |
| 403 | "You must be an admin to access this endpoint." |
| 404 | "Organization org-xxx not found." |

---

### 5. Delete Organization

**DELETE** `/organizations/<organization_id>`

Delete an organization. **Admin only.**

**Important:** When an organization is deleted, all member users have their `organization_id` and `organization_role` set to `null`. The users themselves are NOT deleted.

#### Example Request

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/organizations/org-abc123def456"
```

#### Response

```json
{
  "deleted_organization_id": "org-abc123def456"
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 403 | "You must be an admin to access this endpoint." |
| 404 | "Organization org-xxx not found." |

---

## User-Organization Relationship

Users have the following organization-related fields:

| Field | Type | Description |
|-------|------|-------------|
| `organization_id` | string \| null | ID of the organization the user belongs to |
| `organization_role` | string \| null | `"owner"` or `"member"` |

These fields are visible in the User object returned by user endpoints.

### Filtering Users by Organization

The `/users` endpoint supports filtering by `organization_id`:

**GET** `/users?organization_id=<organization_id>`

#### Example Request

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.openalex.org/users?organization_id=org-abc123def456&page=1&per_page=25&sort=created&desc=true"
```

#### Response

```json
{
  "meta": {
    "count": 5,
    "total_count": 12,
    "page": 1,
    "per_page": 25,
    "total_pages": 1,
    "query": null,
    "plan": null,
    "organization_id": "org-abc123def456",
    "sort": "created",
    "desc": true,
    "elapsed_seconds": 0.045
  },
  "results": [...]
}
```

This is useful for viewing all members of a specific organization from the admin users list.

---

## Authorization Summary

| Endpoint | Admin | Org Owner | Org Member | Non-member |
|----------|-------|-----------|------------|------------|
| List organizations | ✅ | ❌ | ❌ | ❌ |
| Get organization | ✅ | ✅ (own org) | ❌ | ❌ |
| Create organization | ✅ | ❌ | ❌ | ❌ |
| Update organization | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |

---

## GUI Implementation Notes

1. **Admin Dashboard**: Create a searchable, paginated table of organizations showing name, domains, member count, and created date.

2. **Organization Detail View**: Show full organization details with a list of members. Display member roles (owner vs member) with visual distinction.

3. **Create/Edit Form**: 
   - Name field (required)
   - Domains field (support multiple domains, consider a tag-style input)
   - ROR ID field (optional, could add ROR lookup integration)
   - API Keys field (array of strings, consider a tag-style input for adding/removing keys)
   - Plan dropdown (options: `1M-daily`, `2M-daily`, `academic-waiver`, or null/none)
   - Plan Expires At date picker (optional)

4. **Delete Confirmation**: Warn admins that deleting an organization will unlink all members (but not delete users).

5. **Search**: The `q` parameter searches both organization names and domains, so users can find orgs by either.
