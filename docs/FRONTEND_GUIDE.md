# TaskFlow: Frontend Integration Guide

This document is the single source of truth for building a frontend against the TaskFlow API. It describes the product, every endpoint with exact request/response shapes, the permission rules the UI must respect, and the step-by-step user flows from sign-up to day-to-day task management.

---

## 1. Product overview

TaskFlow is a project management tool modeled on Asana.

- Users sign up and log in with email + password.
- **Projects** contain **sections** (board columns such as "To Do", "In Progress", "Done") and **tasks**.
- Each task has a title, description, **status**, **priority**, optional **due date**, optional **assignee**, and belongs to at most one section.
- People collaborate through **project membership**, **comments** on tasks, and a per-project **activity log**.
- Each project has a **summary report** (task counts by status, overdue count, % complete).

### Key concepts

| Concept | Meaning |
|---|---|
| **Global role** | Every user has one role: `admin`, `manager`, or `member`. New sign-ups are `member`. Only an admin can change roles. |
| **Project owner** | The user who created the project (`project.ownerId`). The owner (or any admin) manages the project. |
| **Project member** | A user added to a project. Only members (and admins) can see a project and its tasks. The owner is always a member. |
| **Section** | A board column inside a project, ordered by `position`. Used for layout, independent of status. |
| **Status** | Workflow state: `todo`, `in_progress`, `in_review`, `done`. Any status can move to any other. |
| **Overdue** | A task whose `dueDate` is before today (UTC) and whose status is not `done`. The API returns `isOverdue` on every task. |

---

## 2. Connection basics

| Item | Value |
|---|---|
| Base URL (local) | `http://localhost:3000` |
| Base URL (production) | `https://<your-vercel-app>.vercel.app` |
| Content type | `application/json` for all request and response bodies |
| Auth header | `Authorization: Bearer <token>` on every endpoint except `/health`, `/auth/register`, `/auth/login` |
| Token lifetime | 1 day by default. There is **no refresh token**; on any `401` send the user to the login screen. |
| IDs | UUID strings |
| Timestamps | ISO 8601 strings in UTC, e.g. `"2026-11-08T12:50:31.027Z"` |
| Due dates | Plain date strings `"YYYY-MM-DD"` (no time, no timezone) |
| CORS | Allowed origins are configured on the server with `CORS_ORIGIN` |

Make the base URL configurable (e.g. `VITE_API_URL` / `NEXT_PUBLIC_API_URL`), with no trailing slash. Endpoints are mounted at the root, e.g. `${API_URL}/auth/login`.

### 2.1 Response envelope

Every successful response, except `204 No Content`, is wrapped in `data`:

```jsonc
// Single resource or plain array
{ "data": { ... } }
{ "data": [ ... ] }

// Paginated list
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

`204 No Content` responses (all `DELETE` endpoints) have **an empty body**. Do not call `response.json()` on them.

### 2.2 Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "body.email", "message": "Invalid email" },
      { "field": "body.password", "message": "String must contain at least 8 character(s)" }
    ]
  }
}
```

`details` is only present for validation errors. `field` is prefixed with where the problem was: `body.`, `query.` or `params.`. Strip the prefix to map the error to a form field (`body.email` → `email`).

| HTTP | `code` | When | Suggested UI |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input or business-rule violation (past due date, assignee not a member, section from another project) | Show `details[].message` next to fields; otherwise show `message` |
| 400 | `INVALID_JSON` | Malformed JSON body | Generic error toast |
| 400 | `INVALID_REFERENCE` | A referenced record does not exist | Generic error toast, refetch data |
| 401 | `UNAUTHORIZED` | Missing, invalid, or expired token; wrong credentials | On login form: show message. Elsewhere: clear token, redirect to login |
| 403 | `FORBIDDEN` | Logged in but not allowed (wrong role, not a member, not the owner) | Show message; the UI should normally prevent this by hiding the action |
| 404 | `NOT_FOUND` | Resource or route does not exist | "Not found" state |
| 409 | `CONFLICT` | Duplicate email, member already added, duplicate section name, removing the owner, changing your own role | Show `message` |
| 500 | `INTERNAL_ERROR` | Unexpected server error | "Something went wrong, try again" |

### 2.3 Pagination parameters

All paginated endpoints accept:

| Param | Type | Default | Rules |
|---|---|---|---|
| `page` | integer | `1` | ≥ 1 |
| `limit` | integer | `20` | 1 – 100. Values above 100 return `400`. |

---

## 3. Data types

Copy these into the frontend as TypeScript types.

```ts
type UserRole = 'admin' | 'manager' | 'member';
type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';   // ascending importance
type DueStatus = 'overdue' | 'due_today' | 'due_this_week';
type SortOrder = 'asc' | 'desc';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;          // compare with the current user's id to decide "can manage"
  createdAt: string;
  updatedAt: string;
}

interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;           // the user's GLOBAL role, not a project role
  joinedAt: string;
}

interface Section {
  id: string;
  projectId: string;
  name: string;
  position: number;         // lower = further left
  createdAt: string;
}

interface Task {
  id: string;
  projectId: string;
  sectionId: string | null; // null when not in a section (e.g. its section was deleted)
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  createdBy: string;
  dueDate: string | null;   // "YYYY-MM-DD"
  completedAt: string | null; // set when status becomes "done", cleared when it leaves "done"
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectSummary {
  projectId: string;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>; // every status key is always present
  overdueTasks: number;
  completionPercentage: number;              // integer 0–100
}

type ActivityAction =
  | 'project.created' | 'member.added' | 'member.removed'
  | 'task.created' | 'task.assigned' | 'task.unassigned'
  | 'task.status_changed' | 'task.deleted' | 'comment.added';

interface ActivityLog {
  id: string;
  projectId: string;
  taskId: string | null;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  details: Record<string, unknown>; // shape depends on action, see section 5.9
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}
```

---

## 4. Permission rules for the UI

The server enforces all rules. The UI should **hide or disable** actions the user can't perform, so they rarely hit a `403`.

Derive these flags once you have the current user (`GET /auth/me`) and the project:

```ts
const isAdmin = user.role === 'admin';
const canCreateProject = user.role === 'admin' || user.role === 'manager';
const canManageProject = isAdmin || project.ownerId === user.id;
const canDeleteComment = (c: Comment) => isAdmin || c.authorId === user.id;
```

| Action | Who can do it | Flag |
|---|---|---|
| See "Users" admin screen, change roles | Admin | `isAdmin` |
| "New project" button | Admin, manager | `canCreateProject` |
| Edit / delete project | Owner, admin | `canManageProject` |
| Add / remove members | Owner, admin | `canManageProject` |
| Create / rename / reorder / delete sections | Owner, admin | `canManageProject` |
| Create task | Any project member | always (inside a visible project) |
| Set assignee when creating a task | Owner, admin | `canManageProject` |
| Edit task title / description / priority / due date / section | Any project member | always |
| Change task status | Any project member | always |
| Assign / unassign task | Owner, admin | `canManageProject` |
| Delete task | Owner, admin | `canManageProject` |
| Add comment | Any project member | always |
| Delete comment | Author, admin | `canDeleteComment(c)` |
| View summary and activity | Any project member | always |

Important nuances:
- A **manager who is not the owner** of a project has the same rights as a member inside that project.
- Admins see **all** projects, even ones they are not a member of.
- Non-members get `403` on every project-scoped endpoint. Treat that as "no access" and route back to the project list.

---

## 5. Endpoint reference

Legend: 🔓 public · 🔐 requires token

### 5.1 Health

#### `GET /health` 🔓
Checks that the API and database are reachable.

`200`
```json
{ "data": { "status": "ok", "database": "connected" } }
```

---

### 5.2 Authentication

#### `POST /auth/register` 🔓
Create an account. The new user always gets role `member`.

Body:
| Field | Type | Rules |
|---|---|---|
| `name` | string | required, 1–100 chars (trimmed) |
| `email` | string | required, valid email, ≤ 255 chars (stored lowercase) |
| `password` | string | required, 8–72 chars |

`201` → `{ data: AuthResponse }`
```json
{
  "data": {
    "user": { "id": "…", "name": "Jordan Lee", "email": "jordan@example.com", "role": "member", "createdAt": "…", "updatedAt": "…" },
    "token": "eyJhbGciOi…"
  }
}
```
Errors: `400` validation · `409` "An account with this email already exists"

#### `POST /auth/login` 🔓
Body: `{ "email": string, "password": string }`

`200` → `{ data: AuthResponse }` (same shape as register)
Errors: `400` validation · `401` "Invalid email or password"

#### `GET /auth/me` 🔐
Returns the current user. Call it on app start to restore a session from a stored token.

`200` → `{ data: User }`
Errors: `401` missing/invalid/expired token

---

### 5.3 Users (admin only)

#### `GET /users` 🔐 admin
Paginated, sorted by name.

Query: `page`, `limit`, `search` (matches name or email, case-insensitive), `role` (`admin|manager|member`)

`200` → `{ data: User[], meta: PaginationMeta }`
Errors: `403` if not admin

#### `PATCH /users/:userId/role` 🔐 admin
Body: `{ "role": "admin" | "manager" | "member" }`

`200` → `{ data: User }`
Errors: `404` user not found · `409` "You cannot change your own role"

The promoted user's token still carries the old role until they log in again (or the token expires). Tell the admin that in the UI.

---

### 5.4 Projects

#### `GET /projects` 🔐
Projects the user is a member of. Admins get all projects.

Query: `page`, `limit`, `search` (project name), `sortBy` (`createdAt` default | `name`), `order` (`desc` default | `asc`)

`200` → `{ data: Project[], meta: PaginationMeta }`

#### `POST /projects` 🔐 admin or manager
Body:
| Field | Type | Rules |
|---|---|---|
| `name` | string | required, 1–150 chars |
| `description` | string \| null | optional, ≤ 5000 chars |

`201` → `{ data: Project }`

Side effects: the creator becomes owner and member, and three sections are created: "To Do" (0), "In Progress" (1), "Done" (2).
Errors: `403` if role is `member`

#### `GET /projects/:projectId` 🔐 project member
`200` → `{ data: Project }`
Errors: `400` invalid UUID · `403` not a member · `404` not found

#### `PATCH /projects/:projectId` 🔐 owner or admin
Body (at least one field): `{ "name"?: string, "description"?: string | null }`

`200` → `{ data: Project }`

#### `DELETE /projects/:projectId` 🔐 owner or admin
`204`. Permanently deletes the project and **all** its sections, tasks, comments, and activity. Always confirm with the user first.

---

### 5.5 Project members

#### `GET /projects/:projectId/members` 🔐 project member
Not paginated. Sorted by name.

`200` → `{ data: ProjectMember[] }`

Use this list to show the owner's name (match `project.ownerId` to `userId`) and to populate the **assignee picker**.

#### `POST /projects/:projectId/members` 🔐 owner or admin
Add an existing user by email.

Body: `{ "email": string }`

`201` → `{ data: ProjectMember }`
Errors: `404` "No user found with this email" · `409` "User is already a member of this project"

Non-admins cannot search users, so the UI should offer a plain email input.

#### `DELETE /projects/:projectId/members/:userId` 🔐 owner or admin
`204`. The removed user's **unfinished tasks in this project are unassigned**. Refetch tasks afterwards.
Errors: `404` "Member not found" · `409` "The project owner cannot be removed from the project"

---

### 5.6 Sections

#### `GET /projects/:projectId/sections` 🔐 project member
Not paginated. Ordered by `position`, then creation time.

`200` → `{ data: Section[] }`

#### `POST /projects/:projectId/sections` 🔐 owner or admin
Body:
| Field | Type | Rules |
|---|---|---|
| `name` | string | required, 1–100 chars, unique within the project |
| `position` | integer | optional, ≥ 0. Defaults to the end (max position + 1). |

`201` → `{ data: Section }`
Errors: `409` duplicate name

#### `PATCH /sections/:sectionId` 🔐 owner or admin
Body (at least one field): `{ "name"?: string, "position"?: number }`

`200` → `{ data: Section }`

Reordering is manual: the server does **not** shift other sections. After a drag-and-drop, send a `PATCH` with the new `position` for each section whose position changed (e.g. 0, 1, 2, …).

#### `DELETE /sections/:sectionId` 🔐 owner or admin
`204`. Tasks in the section are **kept**. Their `sectionId` becomes `null`. Show them in a "No section" group.

---

### 5.7 Tasks

#### `GET /projects/:projectId/tasks` 🔐 project member
Paginated task list with filters.

| Query param | Type | Description |
|---|---|---|
| `page`, `limit` | integer | Pagination (max `limit` = 100) |
| `status` | TaskStatus | Exact match |
| `priority` | TaskPriority | Exact match |
| `assigneeId` | UUID | Tasks assigned to this user |
| `sectionId` | UUID | Tasks in this section |
| `dueStatus` | `overdue` \| `due_today` \| `due_this_week` | Deadline filter. Always excludes `done` tasks. `due_this_week` = today through today + 6 days. |
| `dueBefore` | `YYYY-MM-DD` | `dueDate` ≤ value |
| `dueAfter` | `YYYY-MM-DD` | `dueDate` ≥ value |
| `search` | string | Case-insensitive match on title (1–100 chars) |
| `sortBy` | `createdAt` (default) \| `dueDate` \| `priority` | `dueDate` puts tasks without a due date last. `priority` ranks low < medium < high < urgent. |
| `order` | `desc` (default) \| `asc` | |

`200` → `{ data: Task[], meta: PaginationMeta }`

#### `POST /projects/:projectId/tasks` 🔐 project member
Body:
| Field | Type | Rules |
|---|---|---|
| `title` | string | required, 1–200 chars |
| `description` | string \| null | optional, ≤ 5000 chars |
| `priority` | TaskPriority | optional, default `medium` |
| `sectionId` | UUID | optional, must belong to this project. Default: the project's first section. |
| `dueDate` | `YYYY-MM-DD` | optional, **must not be in the past** (UTC) |
| `assigneeId` | UUID | optional. **Owner/admin only**, and the user must be a project member. |

New tasks always start with status `todo`.

`201` → `{ data: Task }`
Errors: `400` past due date / section not in project / assignee not a member · `403` member tried to set `assigneeId`

#### `GET /tasks/:taskId` 🔐 project member
`200` → `{ data: Task }`

#### `PATCH /tasks/:taskId` 🔐 project member
Edit details. **Status and assignee are not editable here**; use the dedicated endpoints.

Body (at least one field):
| Field | Type | Notes |
|---|---|---|
| `title` | string | 1–200 chars |
| `description` | string \| null | `null` clears it |
| `priority` | TaskPriority | |
| `sectionId` | UUID \| null | Move between columns; `null` removes it from any section |
| `dueDate` | `YYYY-MM-DD` \| null | Must not be in the past; `null` clears it |

`200` → `{ data: Task }`

#### `PATCH /tasks/:taskId/assignee` 🔐 owner or admin
Body: `{ "assigneeId": string | null }` (`null` = unassign)

`200` → `{ data: Task }` (includes the updated `assigneeName`)
Errors: `400` "Assignee must be a member of this project" · `403` not owner/admin

#### `PATCH /tasks/:taskId/status` 🔐 project member
Body: `{ "status": "todo" | "in_progress" | "in_review" | "done" }`

`200` → `{ data: Task }`. Moving to `done` sets `completedAt`. Moving away from `done` clears it.

#### `DELETE /tasks/:taskId` 🔐 owner or admin
`204`. Also deletes the task's comments.

#### `GET /me/tasks` 🔐
Tasks assigned to the current user across **all** projects. Good for a "My Tasks" home screen.

Query: same as the project task list **except** `assigneeId` and `sectionId`, plus:
| Param | Type | Description |
|---|---|---|
| `projectId` | UUID | Limit to one project |

`200` → `{ data: Task[], meta: PaginationMeta }`

Tasks include `projectId` but not the project name. Map it using the result of `GET /projects`.

---

### 5.8 Comments

#### `GET /tasks/:taskId/comments` 🔐 project member
Paginated, **oldest first**.

Query: `page`, `limit`

`200` → `{ data: Comment[], meta: PaginationMeta }`

#### `POST /tasks/:taskId/comments` 🔐 project member
Body: `{ "body": string }` (1–2000 chars)

`201` → `{ data: Comment }` (includes `authorName`)

#### `DELETE /comments/:commentId` 🔐 author or admin
`204`
Errors: `403` "You can only delete your own comments" · `404` not found

---

### 5.9 Reports

#### `GET /projects/:projectId/summary` 🔐 project member
`200`
```json
{
  "data": {
    "projectId": "…",
    "totalTasks": 6,
    "tasksByStatus": { "todo": 3, "in_progress": 1, "in_review": 1, "done": 1 },
    "overdueTasks": 1,
    "completionPercentage": 17
  }
}
```

#### `GET /projects/:projectId/activity` 🔐 project member
Paginated, **newest first**.

Query: `page`, `limit`

`200` → `{ data: ActivityLog[], meta: PaginationMeta }`

`details` by action, with suggested display text:

| `action` | `details` | Display text |
|---|---|---|
| `project.created` | `{ name }` | "{actorName} created the project" |
| `member.added` | `{ userId, name }` | "{actorName} added {name}" |
| `member.removed` | `{ userId, name, unassignedTaskCount }` | "{actorName} removed {name} ({unassignedTaskCount} tasks unassigned)" |
| `task.created` | `{ title }` | "{actorName} created task "{title}"" |
| `task.assigned` | `{ assigneeId, previousAssigneeId }` | "{actorName} assigned a task" (resolve `assigneeId` with the members list) |
| `task.unassigned` | `{ assigneeId: null, previousAssigneeId }` | "{actorName} unassigned a task" |
| `task.status_changed` | `{ from, to }` | "{actorName} moved a task from {from} to {to}" |
| `task.deleted` | `{ taskId, title }` | "{actorName} deleted task "{title}"" (top-level `taskId` is `null`) |
| `comment.added` | `{}` | "{actorName} commented on a task" |

---

## 6. Step-by-step user flows

### Flow 1: Sign up
1. Show a form with **Name**, **Email**, **Password** (min 8 chars).
2. `POST /auth/register`.
3. On `201`: store `data.token` (e.g. `localStorage`) and `data.user` in app state, then go to **My Tasks** or **Projects**.
4. On `409`: show "An account with this email already exists" under the email field and link to login.
5. On `400`: map `details` to fields.

New users are `member`s. They see an empty project list until a project owner adds them. Show an empty state like *"You're not in any projects yet. Ask a project owner to add you using your email: {email}."*

### Flow 2: Log in and restore a session
1. **Login:** `POST /auth/login` → store `token` and `user` → go to the home screen. On `401`, show "Invalid email or password".
2. **On app start:** if a token is stored, call `GET /auth/me`.
   - `200`: the user is logged in. Refresh the stored `user`, since the role may have changed.
   - `401`: clear the token and show the login screen.
3. **Global 401 handling:** in the HTTP client, any `401` from a protected endpoint → clear the token → redirect to login.
4. **Logout:** client-side only. Delete the token and clear cached data. There is no logout endpoint.

### Flow 3: Project list
1. `GET /projects?sortBy=createdAt&order=desc&page=1&limit=20`.
2. Render cards with name, description, and created date. Use `meta.totalPages` for pagination and a search box bound to `search` (debounce ~300 ms).
3. Show a **New project** button only if `canCreateProject`.

### Flow 4: Create a project (manager/admin)
1. Modal with **Name** and optional **Description**.
2. `POST /projects` → on `201`, navigate to `/projects/{id}`.
3. The project already has three sections and the creator as a member, so the board renders immediately.

### Flow 5: Open a project (board view)
Load in parallel:
```
GET /projects/:projectId
GET /projects/:projectId/sections
GET /projects/:projectId/members
GET /projects/:projectId/tasks?limit=100&sortBy=priority&order=desc
```
Then:
1. Compute `canManageProject`.
2. Render one column per section (sorted by `position`). Place each task in the column whose `id === task.sectionId`. Add a "No section" column if any task has `sectionId === null`.
3. If `meta.totalPages > 1`, fetch the remaining pages (or load more on scroll).
4. On a task card show: title, priority badge, status chip, due date (red when `isOverdue`), assignee initials from `assigneeName`.
5. If any request returns `403`, show "You don't have access to this project" and link back to the project list.

Optional toolbar filters map directly to query params: status, priority, assignee (from the members list), due (`overdue` / `due_today` / `due_this_week`), search, and sort.

### Flow 6: Manage members (owner/admin)
1. "Members" panel: list from `GET /projects/:projectId/members`. Mark the owner (`userId === project.ownerId`) with an "Owner" badge and no remove button.
2. **Add:** email input → `POST /projects/:projectId/members` → on `201`, append to the list. Show the `404`/`409` messages inline.
3. **Remove:** confirm dialog ("Their open tasks will be unassigned") → `DELETE /projects/:projectId/members/:userId` → refetch members **and** tasks.

### Flow 7: Manage sections (owner/admin)
- **Add column:** `POST /projects/:projectId/sections` with `{ name }`.
- **Rename:** `PATCH /sections/:sectionId` with `{ name }`.
- **Reorder:** after drag-and-drop, compute new positions 0..n-1 and send `PATCH /sections/:id { position }` for each changed section.
- **Delete:** confirm ("Tasks will move to No section") → `DELETE /sections/:sectionId` → refetch sections and tasks.

### Flow 8: Create a task
1. "Add task" button at the bottom of each column (pre-fills `sectionId`) or a global "New task" button.
2. Form fields: Title (required), Description, Priority (default medium), Due date (date input with `min` = today in UTC), Section, and Assignee **only if** `canManageProject`, with options from the members list.
3. `POST /projects/:projectId/tasks`. Omit empty optional fields; don't send `""`.
4. On `201`, insert the returned task into its column.

### Flow 9: Task detail view
Open a drawer or modal on task click:
```
GET /tasks/:taskId
GET /tasks/:taskId/comments?limit=50
```
Inside it:
- **Edit fields** (title, description, priority, due date, section) → `PATCH /tasks/:taskId` with only the changed fields. To clear the due date, send `"dueDate": null`.
- **Status dropdown** → `PATCH /tasks/:taskId/status`. Show `completedAt` when status is `done`.
- **Assignee dropdown** (only if `canManageProject`; read-only text otherwise) → `PATCH /tasks/:taskId/assignee` with `{ assigneeId }` or `{ assigneeId: null }`.
- **Delete** (only if `canManageProject`) → confirm → `DELETE /tasks/:taskId` → close the drawer and remove the card.
- **Comments:** list oldest-first. Add via `POST /tasks/:taskId/comments`. Show a delete icon only when `canDeleteComment(comment)`.

Every mutation returns the updated task, so replace the card in local state with it. No refetch is needed.

### Flow 10: Move a task on the board (drag and drop)
- Dropping into another **column** → `PATCH /tasks/:taskId` with `{ "sectionId": "<target section id>" }`.
- If the product should also tie columns to status (e.g. dropping into "Done" marks it done), call `PATCH /tasks/:taskId/status` as well. The API treats section and status independently, so this mapping is a UI choice.
- Apply the change optimistically. Revert and show the error if the request fails.

### Flow 11: My Tasks (home screen)
1. `GET /me/tasks?sortBy=dueDate&order=asc&limit=50` and `GET /projects?limit=100`. Use the projects list to show project names.
2. Suggested tabs, each a separate query:
   - **Overdue:** `dueStatus=overdue`
   - **Today:** `dueStatus=due_today`
   - **This week:** `dueStatus=due_this_week`
   - **All open:** no `dueStatus`; hide `done` tasks client-side or request each status separately
   - **Completed:** `status=done&sortBy=createdAt&order=desc`
3. Clicking a task opens the same task detail view (Flow 9).

### Flow 12: Project dashboard
1. `GET /projects/:projectId/summary`: render a progress bar (`completionPercentage`), a count per status, and an overdue badge.
2. `GET /projects/:projectId/activity?limit=20`: a timeline with "Load more" using `page`. Use the display text table in section 5.9.

### Flow 13: Admin user management (admin only)
1. Show a "Users" item in the navigation only if `isAdmin`.
2. `GET /users?search=&role=&page=1&limit=20` → table with name, email, role, and joined date.
3. A role dropdown per row → `PATCH /users/:userId/role`. Disable it on the admin's own row (the API returns `409`).
4. Show a note: "Role changes apply the next time the user logs in."

---

## 7. Implementation checklist

- [ ] One HTTP client that adds the base URL and `Authorization` header, unwraps `data`, handles `204` (no JSON parsing), and converts error responses into a typed `ApiError`.
- [ ] Global `401` handler → logout and redirect to login.
- [ ] Current user stored in global state and refreshed via `GET /auth/me` on startup.
- [ ] Permission flags computed per project (`canManageProject`) and used to hide controls.
- [ ] Forms validate the same limits as the API (lengths, password ≥ 8, due date ≥ today) and still display server `details`.
- [ ] Dates: send `dueDate` as `YYYY-MM-DD`. Display timestamps in the user's local timezone. Compute the minimum due date with UTC (`new Date().toISOString().slice(0, 10)`).
- [ ] Never send empty strings for optional fields. Omit them, or send `null` where clearing is allowed.
- [ ] After removing a member or deleting a section, refetch tasks (the server changes tasks as a side effect).
- [ ] Confirm before every destructive action (delete project, task, section, comment; remove member).

## 8. Demo accounts (after `npm run seed`)

All passwords: `Password123!`

| Email | Role | Notes |
|---|---|---|
| admin@taskflow.dev | admin | Sees every project and the Users screen |
| maya@taskflow.dev | manager | Owns "Website Redesign" and "Q1 Marketing Campaign" |
| daniel@taskflow.dev | manager | Owns "Mobile App Launch" |
| priya@taskflow.dev | member | In "Website Redesign"; has an overdue task |
| leo@taskflow.dev | member | In "Website Redesign" and "Mobile App Launch" |
| sara@taskflow.dev | member | In "Website Redesign" and "Q1 Marketing Campaign" |
| omar@taskflow.dev | member | In "Mobile App Launch" and "Q1 Marketing Campaign" |
