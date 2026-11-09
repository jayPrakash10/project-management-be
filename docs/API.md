# TaskFlow API: request examples

Examples use `curl` against a local server. Replace `BASE` for a deployed instance.

```bash
BASE=http://localhost:3000/api
```

The IDs below are placeholders. Copy real IDs from earlier responses.

---

## 1. Authentication

### Register

```bash
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jordan Lee","email":"jordan@example.com","password":"supersecret1"}'
```

`201 Created`
```json
{
  "data": {
    "user": {
      "id": "6f1c…",
      "name": "Jordan Lee",
      "email": "jordan@example.com",
      "role": "member",
      "createdAt": "2026-11-08T12:00:00.000Z",
      "updatedAt": "2026-11-08T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs…"
  }
}
```

### Log in

```bash
curl -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maya@taskflow.dev","password":"Password123!"}'
```

Save the token for the next calls:

```bash
TOKEN=<token from the response>
```

### Current user

```bash
curl $BASE/auth/me -H "Authorization: Bearer $TOKEN"
```

---

## 2. Projects and members

### Create a project (manager or admin)

```bash
curl -X POST $BASE/projects \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Customer Portal","description":"Self-service portal for enterprise customers"}'
```

`201 Created`. The project is created together with three default sections and the creator as a member.

### List my projects

```bash
curl "$BASE/projects?search=portal&sortBy=name&order=asc&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "data": [ { "id": "PROJECT_ID", "name": "Customer Portal", "ownerId": "…", "…": "…" } ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

### Add a member by email (owner or admin)

```bash
curl -X POST $BASE/projects/PROJECT_ID/members \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"priya@taskflow.dev"}'
```

### Remove a member (their unfinished tasks become unassigned)

```bash
curl -X DELETE $BASE/projects/PROJECT_ID/members/USER_ID -H "Authorization: Bearer $TOKEN"
```

`204 No Content`. Removing the project owner returns `409`.

---

## 3. Sections

```bash
# List (ordered by position)
curl $BASE/projects/PROJECT_ID/sections -H "Authorization: Bearer $TOKEN"

# Create (position defaults to the end)
curl -X POST $BASE/projects/PROJECT_ID/sections \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Backlog"}'

# Rename / reorder
curl -X PATCH $BASE/sections/SECTION_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Icebox","position":0}'
```

---

## 4. Tasks

### Create a task

```bash
curl -X POST $BASE/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title": "Design login page",
    "description": "Email + password with a forgot-password link",
    "priority": "high",
    "dueDate": "2026-12-01",
    "assigneeId": "USER_ID"
  }'
```

`201 Created`
```json
{
  "data": {
    "id": "TASK_ID",
    "projectId": "PROJECT_ID",
    "sectionId": "FIRST_SECTION_ID",
    "title": "Design login page",
    "status": "todo",
    "priority": "high",
    "assigneeId": "USER_ID",
    "assigneeName": "Priya Sharma",
    "dueDate": "2026-12-01",
    "completedAt": null,
    "isOverdue": false,
    "…": "…"
  }
}
```

Business-rule errors:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Due date cannot be in the past",
  "details": [ { "field": "body.dueDate", "message": "Due date cannot be in the past" } ] } }
```

### Assign / unassign (owner or admin)

```bash
curl -X PATCH $BASE/tasks/TASK_ID/assignee \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"assigneeId":"USER_ID"}'

# Unassign
curl -X PATCH $BASE/tasks/TASK_ID/assignee \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"assigneeId":null}'
```

### Change status

```bash
curl -X PATCH $BASE/tasks/TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

Moving to `done` sets `completedAt`. Moving out of `done` clears it.

### Update details / move to another section

```bash
curl -X PATCH $BASE/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sectionId":"SECTION_ID","priority":"urgent","dueDate":null}'
```

### List, filter, sort

```bash
# High-priority open tasks in a project, by due date
curl "$BASE/projects/PROJECT_ID/tasks?priority=high&status=in_progress&sortBy=dueDate&order=asc" \
  -H "Authorization: Bearer $TOKEN"

# Overdue tasks in a project
curl "$BASE/projects/PROJECT_ID/tasks?dueStatus=overdue" -H "Authorization: Bearer $TOKEN"

# Keyword search with a due-date window
curl "$BASE/projects/PROJECT_ID/tasks?search=login&dueAfter=2026-11-01&dueBefore=2026-11-30" \
  -H "Authorization: Bearer $TOKEN"

# My tasks due this week across all projects, most urgent first
curl "$BASE/me/tasks?dueStatus=due_this_week&sortBy=priority&order=desc" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Comments

```bash
curl -X POST $BASE/tasks/TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"body":"First draft is in Figma, feedback welcome."}'

curl "$BASE/tasks/TASK_ID/comments?page=1&limit=20" -H "Authorization: Bearer $TOKEN"

curl -X DELETE $BASE/comments/COMMENT_ID -H "Authorization: Bearer $TOKEN"
```

---

## 6. Reports

### Project summary

```bash
curl $BASE/projects/PROJECT_ID/summary -H "Authorization: Bearer $TOKEN"
```

```json
{
  "data": {
    "projectId": "PROJECT_ID",
    "totalTasks": 6,
    "tasksByStatus": { "todo": 3, "in_progress": 1, "in_review": 1, "done": 1 },
    "overdueTasks": 1,
    "completionPercentage": 17
  }
}
```

### Activity log

```bash
curl "$BASE/projects/PROJECT_ID/activity?limit=10" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "data": [
    {
      "id": "…",
      "action": "task.status_changed",
      "actorName": "Priya Sharma",
      "taskId": "TASK_ID",
      "details": { "from": "in_progress", "to": "done" },
      "createdAt": "2026-11-08T12:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 14, "totalPages": 2 }
}
```

Logged actions: `project.created`, `member.added`, `member.removed`, `task.created`, `task.assigned`, `task.unassigned`, `task.status_changed`, `task.deleted`, `comment.added`.

---

## 7. Admin

```bash
# Find users
curl "$BASE/users?search=priya&role=member" -H "Authorization: Bearer $ADMIN_TOKEN"

# Promote to manager
curl -X PATCH $BASE/users/USER_ID/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"role":"manager"}'
```
