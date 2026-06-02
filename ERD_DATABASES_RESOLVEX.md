# ERD support — Civic Problem Management (Resolvex)

This file lists **all MongoDB collections (Mongoose models)** and the **key relationships** between them, so you can draw the **ER diagram**.

## 1) Collections / Models

### 1. `users` (User)
Fields (key):
- `name`
- `email` *(unique)*
- `password`
- `role` *(citizen | admin | department)*
- `department` *(ref → Department, nullable)*
- `isVerified`, `isBlocked`
- password reset / verify token fields


### 2. `departments` (Department)
Fields (key):
- `name` *(unique)*
- `description`, `email`, `phone`
- `categories` *(string array)*
- `head`
- metrics cache: `totalAssigned`, `totalResolved`, `avgResolutionDays`, `slaBreach`


### 3. `complaints` (Complaint)
Fields (key):
- `title`, `description`
- `category`, `priority`
- AI: `aiSuggestion {category, priority, confidence, reason}`
- workflow: `status` ∈ {pending, assigned, in_progress, resolved, rejected, closed}
- workflow history: `timeline[]` (status updates)
- location: `location { type: 'Point', coordinates: [lng,lat], address }`
- media: `images[]`, `videos[]`
- citizen: `user` *(ref → User, required)*
- assignment: `assignedTo` *(ref → Department, nullable)*
- engagement: `upvotes[]` *(refs → User)*, `upvoteCount`
- SLA: `slaDeadline`, `slaBreached`
- resolution: `resolvedAt`, `proofImages[]`


### 4. `comments` (Comment)
Fields (key):
- `complaint` *(ref → Complaint)*
- `user` *(ref → User)*
- `text`
- `isAnonymous`


### 5. `notifications` (Notification)
Fields (key):
- `user` *(ref → User)*
- `title`, `message`
- `type` ∈ {status_update, assignment, comment, upvote, system, sla_breach}
- `complaint` *(ref → Complaint, nullable)*
- `isRead`
- `link`


## 2) Relationships (edges for ER diagram)

Use cardinalities like: **one-to-many** (1..N) unless noted.

### Identity / organization
- `departments` 1 ─── N `users`
  - via `users.department` (nullable)

### Complaints workflow
- `users` 1 ─── N `complaints`
  - via `complaints.user` (citizen who raised complaint)

- `departments` 1 ─── N `complaints`
  - via `complaints.assignedTo` (nullable because complaint may be unassigned)

- `complaints` 1 ─── N `comments`
  - via `comments.complaint`

- `users` 1 ─── N `comments`
  - via `comments.user`

- `complaints` N ─── N `users` (upvotes)
  - via `complaints.upvotes[]` (array of User refs)

### Notifications
- `users` 1 ─── N `notifications`
  - via `notifications.user`

- `complaints` 1 ─── N `notifications`
  - via `notifications.complaint` (nullable)

### Optional non-strict associations (still useful for ERD notes)
- `complaints.timeline[]` is an embedded subdocument (no separate collection)
- `complaints.location`, `aiSuggestion`, `images/videos/proofImages` are embedded arrays/subdocs

## 3) Quick ERD checklist
Include these entities as boxes:
- User
- Department
- Complaint
- Comment
- Notification

Then draw these FK arrows:
- User.department → Department
- Complaint.user → User
- Complaint.assignedTo → Department
- Comment.complaint → Complaint
- Comment.user → User
- Notification.user → User
- Notification.complaint → Complaint

For M:N (upvotes):
- Complaint ↔ User using Complaint.upvotes[] (you can represent as a join table “complaint_upvotes” in ERD even though Mongo stores it as an array).

