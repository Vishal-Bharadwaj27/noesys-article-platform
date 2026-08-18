# DBML

```Text
Table users {
  id text [pk]
  email text [unique, not null]
  name text [not null]
  auth_role text [not null, note: 'super_admin | admin | user']
  job_role text [not null]
  created_at text [not null]
  created_by text [ref: > users.id]
  is_active int [not null, default: 1, note: '1=active, 0=inactive']
}

Table articles {
  id text [pk]
  user_id text [not null, ref: > users.id]
  article_type_id text [not null, ref: > article_types.id]
  title text [not null]
  content text [not null]
  status text [not null, note: 'approved | rewrite_required']
  ai_score real [note: 'null until scored, 0.0 to 10.0']
  version int [not null, default: 1, note: 'increments on every rewrite']
  submitted_at text [not null]
  scored_at text
  month_year text [not null, note: 'e.g. 2026-08']
  retry_count int [not null, default: 0]
}

Table article_types {
  id text [pk]
  name text [unique, not null, note: 'e.g. Marketing, Software, HR']
  description text
  created_by text [not null, ref: > users.id]
  created_at text [not null]
  updated_at text [not null]
}

Table article_history {
  id text [pk]
  article_id text [not null, ref: > articles.id]
  article_type_id text [not null, ref: > article_types.id]
  title text [not null]
  ai_feedback text [not null]
  content text [not null]
  ai_score real
  version int [not null, note: 'version number at the time this snapshot was taken']
  submitted_at text [not null]
  scored_at text
  snapshotted_at text [not null, note: 'when this row was written to history']
}

Table prompts {
  id text [pk]
  article_type_id text [unique, not null, ref: > article_types.id]
  content text [not null, note: 'the full AI scoring prompt for this article type']
  created_by text [not null, ref: > users.id]
  created_at text [not null]
  updated_at text [not null]
}

Table system_settings {
  key text [pk]
  value text [not null]
  updated_at text
}
```


# API Documentation

## Base URL

```text
/api
```

---

# User APIs

## GET /auth/me

**Description:** Validate the authenticated user, automatically create the user if they do not exist, and return the user's profile.

### Response

```json
{
  "message": "User authenticated successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@noesyssoftware.com",
    "job_role": "Senior Engineer",
    "is_active": true
  }
}
```

---

## POST /articles

**Description:** Submit a new article or a rewrite attempt.

### Response

```json
{
  "message": "Article submitted successfully",
  "data": {
    "id": "article_id",
    "status": "pending"
  }
}
```

---

## GET /articles/mine

**Description:** Get all article submissions belonging to the logged-in user.

### Query Parameters

```text
month=2026-08 (optional)
```

### Response

```json
[{
  "article": {
    "id": "article_123",
    "title": "Cloudflare Queues",
    "version": 3,
    "ai_score": 8.2
  },

  "author": {
    "id": "user_1",
    "name": "John Doe"
  },
}]
```

---

## GET /articles/mine/:id

**Description:** Get a specific article along with scoring history and rewrite attempts.

### Response

```json
{
  "message": "Article fetched successfully",
  "data": {
    "article": {
      "id": "article_id",
      "title": "Cloudflare Queues in Production",
      "content": "Full article content..."
    },
    "current_score": 8.0,
    "current_feedback": "Good practical examples and clear explanations.",
    "history": [
      {
        "article_id": "attempt_1",
        "score": 4.1,
        "status": "rewrite_required"
      },
      {
        "article_id": "attempt_2",
        "score": 6.3,
        "status": "rewrite_required"
      },
      {
        "article_id": "attempt_3",
        "score": 8.0,
        "status": "approved"
      }
    ]
  }
}
```

---

# Admin APIs

---

## GET /users

**Description:** Get all users or filter users by submission status for a specific month.

### Query Parameters

```text
month=2026-08
submission_status=submitted
submission_status=not_submitted
```

### Response

```json
{
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@company.com",
      "job_role": "Senior Engineer"
    }
  ]
}
```

---

## GET /users/:id

**Description:** Get details of a specific user.

### Response

```json
{
  "message": "User fetched successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@company.com",
    "job_role": "Senior Engineer",
    "is_active": true
  }
}
```

---

## PATCH /users/:id

**Description:** Update user information.

### Request

```json
{
  "name": "John Doe",
  "job_role": "Lead Engineer",
}
```

### Response

```json
{
  "message": "User updated successfully"
}
```

---

## PATCH /users/:id/status

**Description:** Activate or deactivate a user.

### Request

```json
{
  "is_active": false
}
```

### Response

```json
{
  "message": "User status updated successfully"
}
```

---

## GET /users/:id/articles

**Description:** Get all article submission chains belonging to a specific user.

### Query Parameters

```text
month=2026-08 (optional)
```

### Response

```json
{
  "message": "User articles fetched successfully",
  "data": [
    {
      "id": "article_id",
      "title": "Cloudflare Queues in Production",
      "status": "approved",
      "ai_score": 8.2,
      "attempt_count": 3
    }
  ]
}
```

---

## GET /articles

**Description:** Get article submissions across all users.

### Query Parameters

```text
month=2026-08
status=approved
status=rewrite_required
```

### Response

```json
{
  "article": {
    "id": "article_123",
    "title": "Cloudflare Queues",
    "content": "...",
    "version": 3,
    "ai_score": 8.2
  },

  "author": {
    "id": "user_1",
    "name": "John Doe"
  },

  "history": [
    {
      "version": 1,
      "ai_score": 4.1
    },
    {
      "version": 2,
      "ai_score": 6.5
    }
  ]
}
```

> Returns only the latest attempt of each article submission chain.

---

## GET /articles/:id

**Description:** Get full article details including rewrite history and scoring history.

### Response

```json
{
  "message": "Article fetched successfully",
  "data": {
    "article": {
      "id": "article_id",
      "title": "Cloudflare Queues in Production",
      "content": "Full article content..."
    },
    "author": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@company.com"
    },
    "current_score": 8.0,
    "current_feedback": "Good practical examples and clear explanations.",
    "history": [
      {
        "article_id": "attempt_1",
        "score": 4.1,
        "status": "rewrite_required"
      },
      {
        "article_id": "attempt_2",
        "score": 6.3,
        "status": "rewrite_required"
      },
      {
        "article_id": "attempt_3",
        "score": 8.0,
        "status": "approved"
      }
    ]
  }
}
```

## PATCH /users/:id/role

**Description:** Update a user's role.

### Request

```json
{
  "role": "admin"
}
```

or

```json
{
  "role": "user"
}
```

### Response

```json
{
  "message": "User role updated successfully",
  "data": {
    "id": "user_id",
    "role": "admin"
  }
}
```
## 

### Allowed Roles

```text
user
admin
super_admin
```

---

## GET /article-types

**Description:** Get all available article types.

### Response

```json
{
  "message": "Article types fetched successfully",
  "data": [
    {
      "id": "article_type_id",
      "name": "Software Engineering",
      "description": "Technical engineering articles"
    },
    {
      "id": "article_type_id",
      "name": "Marketing",
      "description": "Marketing related articles"
    }
  ]
}
```

---

## POST /article-types

**Description:** Create a new article type.

### Request

```json
{
  "name": "DevOps",
  "description": "Infrastructure and deployment related articles"
}
```

### Response

```json
{
  "message": "Article type created successfully",
  "data": {
    "id": "article_type_id"
  }
}
```

---

## PATCH /article-types/:id

**Description:** Update an existing article type.

### Request

```json
{
  "name": "Software Engineering",
  "description": "Updated description"
}
```

### Response

```json
{
  "message": "Article type updated successfully"
}
```

---

## DELETE /article-types/:id

**Description:** Delete an article type.

### Response

```json
{
  "message": "Article type deleted successfully"
}
```

---

## GET /prompts

**Description:** Get all AI scoring prompts.

### Response

```json
{
  "message": "Prompts fetched successfully",
  "data": [
    {
      "id": "prompt_id",
      "article_type_id": "article_type_id",
      "article_type": "Software Engineering",
      "content": "You are reviewing an article..."
    }
  ]
}
```

---

## GET /prompts/:articleTypeId

**Description:** Get the AI scoring prompt for a specific article type.

### Response

```json
{
  "message": "Prompt fetched successfully",
  "data": {
    "id": "prompt_id",
    "article_type_id": "article_type_id",
    "content": "You are reviewing an article..."
  }
}
```

---

## PATCH /prompts/:articleTypeId

**Description:** Update the AI scoring prompt for an article type.

### Request

```json
{
  "content": "Updated scoring prompt..."
}
```

### Response

```json
{
  "message": "Prompt updated successfully"
}
```


---

# Shared APIs

## GET /health

**Description:** Service health check endpoint.

### Response

```json
{
  "message": "Service is healthy"
}
```

---

---

## GET /fallback-prompt

**Description:** Get the global fallback AI scoring prompt used when no article-type-specific prompt exists.

### Response

```json
{
  "message": "Fallback prompt fetched successfully",
  "data": {
    "content": "You are reviewing an internal technical article..."
  }
}
```

---

## PATCH /fallback-prompt

**Description:** Update the global fallback AI scoring prompt.

### Request

```json
{
  "content": "You are reviewing an internal article written by an employee..."
}
```

### Response

```json
{
  "message": "Fallback prompt updated successfully"
}
```

---

# Endpoint Summary

| Method | Endpoint | Description |
|----------|----------|----------|
| GET | /auth/me | Validate the authenticated user, auto-provision the user if they do not exist, and return the user's profile. |
| GET | /articles/mine | Get the authenticated user's article submission chains. |
| GET | /articles/mine/:id | Get a specific article with complete rewrite history and scoring history. |
| POST | /articles | Submit a new article or rewrite an existing article. |
| GET | /users | Get all users with optional filters. |
| GET | /users/:id | Get a specific user's details. |
| PATCH | /users/:id | Update user information. |
| PATCH | /users/:id/status | Activate or deactivate a user. |
| PATCH | /users/:id/role | Update a user's role. |
| GET | /users/:id/articles | Get all article submission chains belonging to a specific user. |
| GET | /articles | Get article submissions across all users. |
| GET | /articles/:id | Get full article details including rewrite history and scoring history. |
| GET | /article-types | Get all available article types. |
| POST | /article-types | Create a new article type. |
| PATCH | /article-types/:id | Update an existing article type. |
| DELETE | /article-types/:id | Delete an article type. |
| GET | /prompts | Get all article-type-specific AI scoring prompts. |
| GET | /prompts/:articleTypeId | Get the AI scoring prompt for a specific article type. |
| PATCH | /prompts/:articleTypeId | Update the AI scoring prompt for a specific article type. |
| GET | /fallback-prompt | Get the global fallback AI scoring prompt. |
| PATCH | /fallback-prompt | Update the global fallback AI scoring prompt. |

# Prompt

```text
You are reviewing an article written by an employee at a software company.

Your goal is to evaluate whether the article provides useful knowledge to other employees.

The author's role is: {{job_role}}

The article to evaluate is:

Title: {{title}}

Content:
{{content}}

---

Evaluation Criteria:

1. Clarity — Is the article easy to understand?
2. Structure — Does it have a logical flow with introduction, explanation, and conclusion?
3. Technical Accuracy — Are concepts explained correctly?
4. Practical Value — Will another employee learn something useful?
5. Depth Appropriate To Role — Evaluate the depth and complexity of the article relative to the author's role. Do not penalize the author for not demonstrating
knowledge or responsibilities beyond what would reasonably be expected for their role.


Scoring:
0-4  = Poor
5-6  = Needs Improvement
7-8  = Good
9-10 = Excellent

The purpose of this system is knowledge sharing, not academic publishing.
Reward practical usefulness.
Focus on whether another employee would learn something valuable.

---

Return only a JSON object with no preamble or explanation outside it.

{
  "score": number,
  "feedback": string
}

The feedback must be 2-3 sentences minimum, 5-6  sentences maximum, specific to this article, written in a
constructive collegial tone, addressing the author directly using "you".

If the score is below 7, provide specific actionable suggestions for improvement.
If the score is 7 or above, explain what made the article effective.
```

# Auth workflow

````text
User accesses application
        ↓
Cloudflare Access intercepts request
        ↓
Redirect user to Microsoft Entra ID
        ↓
User authenticates with Microsoft account
        ↓
Microsoft Entra ID validates credentials
        ↓
Cloudflare Access receives identity claims
        ↓
Cloudflare Access issues signed JWT
        ↓
JWT sent to Cloudflare Worker in
Cf-Access-Jwt-Assertion header
        ↓
Worker validates JWT
        ↓
Extract email and name from JWT claims
        ↓
Look up user in D1 by email
        ↓
User exists?
        ├─ Yes → Check is_active
        │           ├─ Active → Attach user to request context → Allow access
        │           └─ Inactive → Return 403 Forbidden
        └─ No  → Create user in D1
                  (email, name from JWT, default role = "user")
                        ↓
                 Attach user to request context → Allow access````
