  # Panel Flow + Wireframes (Resolvex) — Citizen / Admin / Department

  This file documents:
  1) **Flow of each panel** based on the current React routes
  2) **Wireframe templates** (ASCII / layout blocks) you can convert into diagrams/images

  > Note: This project is different from the hostel one. It is **Resolvex** (Civic Complaint Management with AI suggestions).

  ---

  ## 0) Global App Flow (Auth)

  ### Public routes
  - `/` → Landing (marketing + login/register)
  - `/login` → Login (email/password)
  - `/signup` → Signup (create account)
  - `/verify-email` → Email verification screen

  ### Auth token
  - Token stored in client local storage (see `client/src/services/api.js`).
  - API requests use `Authorization: Bearer <token>`.

  ### Protected route behavior
  - `ProtectedRoute allowedRoles={[...role]}` checks:
    - user is logged in
    - role matches required role(s)

  ---

  ## 1) Citizen Panel Flow (Role: `citizen`)

  ### Route map (from `client/src/App.jsx`)
  - `/dashboard` → `CitizenDashboard`
  - `/raise-complaint` → `RaiseComplaint`
  - `/my-complaints` → `MyComplaints`
  - `/complaints/:id` → `ComplaintDetail`
  - `/profile` → `Profile`

  ### A) Citizen Dashboard
  **Purpose:** summary + quick actions
  - Show: counts (pending/assigned/resolved) + recent complaints
  - Show: quick CTA to raise complaint

  Wireframe:
  ```
  +-----------------------------+
  | Citizen Dashboard          |
  +-----------------------------+
  | Summary Cards               |
  |  Pending | Assigned | Done |
  +-----------------------------+
  | Quick Actions              |
  |  [Raise Complaint]          |
  |  [My Complaints]           |
  +-----------------------------+
  | Recent Complaints (list)  |
  |  status | title | date     |
  +-----------------------------+
  ```

  ### B) Raise Complaint
  **Purpose:** submit complaint + media + location
  - Inputs:
    - title, description
    - category (optional AI category suggestion)
    - location (lat/lng + address if UI provides)
    - images/videos uploads (handled by backend)
  - Output:
    - creates `Complaint` with `status=pending`
    - backend runs AI classify/suggest (if enabled)

  Wireframe:
  ```
  +-----------------------------+
  | Raise Complaint             |
  +-----------------------------+
  | [ Title ]                  |
  | [ Description ]            |
  | [ Category ]              |
  | [ Location Picker ]       |
  | [ Upload Images ]         |
  | [ Upload Videos ]         |
  +-----------------------------+
  | [ Submit Complaint ]      |
  +-----------------------------+
  ```

  ### C) My Complaints
  **Purpose:** list + filter complaints
  - Table/cards with status
  - Clicking card opens `ComplaintDetail`

  Wireframe:
  ```
  +-----------------------------+
  | My Complaints              |
  +-----------------------------+
  | Filters: status/category  |
  +-----------------------------+
  | Complaints List           |
  | title | status | SLA | ...|
  +-----------------------------+
  ```

  ### D) Complaint Detail
  **Purpose:** timeline + comments + status
  - Shows timeline entries (`timeline[]`)
  - Shows AI suggestion (if any)
  - Shows media (images/videos)
  - Allows comment / view updates

  Wireframe:
  ```
  +-----------------------------+
  | Complaint Detail           |
  +-----------------------------+
  | Title / Status / SLA      |
  | AI Suggestion (optional)   |
  +-----------------------------+
  | Timeline (stepper)         |
  | pending -> assigned -> ... |
  +-----------------------------+
  | Media Gallery              |
  +-----------------------------+
  | Comments                   |
  | [Add Comment]             |
  +-----------------------------+
  ```

  ### E) Profile
  **Purpose:** update user profile
  - User fields: name, phone, address, etc.

  Wireframe:
  ```
  +-----------------------------+
  | Profile                    |
  +-----------------------------+
  | Form: Name / Phone / ... |
  | [ Save ]                   |
  +-----------------------------+
  ```

  ---

  ## 2) Admin Panel Flow (Role: `admin`)

  ### Route map
  - `/admin/dashboard` → `AdminDashboard`
  - `/admin/complaints` → `AdminComplaints`
  - `/admin/users` → `AdminUsers`
  - `/admin/departments` → `AdminDepartments`
  - `/admin/analytics` → `AdminAnalytics`
  - `/admin/sla` → `AdminSLA`

  ### A) Admin Dashboard
  **Purpose:** analytics overview
  - summary metrics, charts (counts by status, SLA breaches, etc.)

  Wireframe:
  ```
  +-----------------------------+
  | Admin Dashboard            |
  +-----------------------------+
  | KPI Cards                  |
  | total | pending | SLA hit |
  +-----------------------------+
  | Charts: status/category   |
  +-----------------------------+
  ```

  ### B) Admin Complaints
  **Purpose:** manage complaints (view/assign workflow)
  - List/search complaints
  - Open complaint detail
  - Actions: assign to department, update status, resolve/reject

  Wireframe:
  ```
  +-----------------------------+
  | Complaints (Admin)        |
  +-----------------------------+
  | Filters/Search             |
  +-----------------------------+
  | Complaints Table          |
  | title | status | dept |SLA|
  +-----------------------------+
  ```

  ### C) Admin Users
  **Purpose:** manage users and blocks (as supported by backend)

  Wireframe:
  ```
  +-----------------------------+
  | Users                      |
  +-----------------------------+
  | Users Table + Actions     |
  | block/unblock, role info  |
  +-----------------------------+
  ```

  ### D) Admin Departments
  **Purpose:** manage departments (CRUD)

  Wireframe:
  ```
  +-----------------------------+
  | Departments                |
  +-----------------------------+
  | Add Department Form        |
  | Departments List + Edit   |
  +-----------------------------+
  ```

  ### E) Admin Analytics
  **Purpose:** performance analytics
  - charts driven by complaint/dept metrics

  Wireframe:
  ```
  +-----------------------------+
  | Analytics                  |
  +-----------------------------+
  | SLA breaches chart        |
  | Avg resolution time chart |
  +-----------------------------+
  ```

  ### F) Admin SLA
  **Purpose:** SLA breach monitoring view
  - highlight breached complaints

  Wireframe:
  ```
  +-----------------------------+
  | SLA Breaches              |
  +-----------------------------+
  | Breached Complaints list |
  | deadline | status | dept  |
  +-----------------------------+
  ```

  ---

  ## 3) Department Panel Flow (Role: `department`)

  ### Route map
  - `/dept/assigned` → `DeptAssigned`
  - `/dept/complaints/:id` → `DeptComplaintDetail`
  - `/dept/performance` → `DeptPerformance`

  ### A) Department Assigned
  **Purpose:** work queue
  - Shows complaints assigned to this department
  - Allows open detail view

  Wireframe:
  ```
  +-----------------------------+
  | Assigned Complaints       |
  +-----------------------------+
  | Filters/Search             |
  +-----------------------------+
  | Queue List                 |
  | title | status | SLA       |
  +-----------------------------+
  ```

  ### B) Department Complaint Detail
  **Purpose:** update workflow + upload progress proof
  - Actions: accept/reject/progress/complete
  - Upload proofImages when progressing/completing

  Wireframe:
  ```
  +-----------------------------+
  | Complaint Detail (Dept)  |
  +-----------------------------+
  | Update Status             |
  | accept / reject           |
  | progress / complete      |
  +-----------------------------+
  | Proof Images Upload       |
  | [Upload]                  |
  +-----------------------------+
  | Timeline + remarks        |
  +-----------------------------+
  ```

  ### C) Department Performance
  **Purpose:** show department metrics
  - charts for assigned/resolved/avg days/SLA breach count

  Wireframe:
  ```
  +-----------------------------+
  | Performance                |
  +-----------------------------+
  | Metrics cards              |
  | charts (bars/lines)       |
  +-----------------------------+
  ```
