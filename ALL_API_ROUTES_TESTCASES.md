# Resolvex — All API Routes Test Cases (Expanded)

This file provides a **complete, expanded test table** for **every API route** used in the current codebase.

## 0) Assumptions (based on repository code)
- Base URL: `http://localhost:5000/api`
- Auth: `Authorization: Bearer <token>`
- Roles: `citizen | admin | department`
- Protected endpoints use `protect` middleware.
- Role-restricted endpoints use `authorize(...roles)`.
- Upload limits:
  - Complaint create: `images` max 5, `videos` max 2
  - Department progress: `proofImages` max 5

---

## A) Auth Routes — `/api/auth/*`

### A1. `POST /api/auth/register`
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-R-001 | Integration | API | Email unique | Valid payload | Call register with `{name,email,password,role?}` | 201/200 success; user created; verification token created if configured |
| AUTH-R-002 | Integration | API | Duplicate email exists | Duplicate | Call register with same email | 400/409 duplicate rejection |
| AUTH-R-003 | Integration | API | None | Invalid email | Call register with malformed email | 400 validation error |
| AUTH-R-004 | Integration | API | None | Weak password | Call register with short password | 400 validation error |

### A2. `POST /api/auth/login`
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-L-001 | Integration | API | Verified citizen/admin/department | Valid creds | Login with correct email/password | 200 + JWT |
| AUTH-L-002 | Integration | API | Valid user but unverified | Verified flag false | Login | 403 with `EMAIL_NOT_VERIFIED` |
| AUTH-L-003 | Integration | API | None | Wrong password | Login with wrong password | 400/401; no JWT |
| AUTH-L-004 | Integration | API | None | Nonexistent email | Login with email not registered | Generic error (no account leak) |

### A3. `POST /api/auth/resend-verification`
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-VR-001 | Integration | API | Unverified user exists | Valid email | Call resend with `{email}` | 200/201; new token stored; email attempted |
| AUTH-VR-002 | Integration | API | Verified user | Valid email | Call resend | 200/403 depending on implementation; no resend spam if blocked |

### A4. `GET /api/auth/verify-email/:token`
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-VE-001 | Integration | API | Valid, unexpired token | Valid token | Call verify endpoint | 200; `isVerified=true`; token cleared |
| AUTH-VE-002 | Integration | API | Expired/invalid token | Invalid token | Call verify endpoint | 400/404; invalid/expired message |

### A5. `POST /api/auth/forgot-password`
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-FP-001 | Integration | API | User exists | Valid email | Call forgot-password | 200; reset token/expiry stored; email attempted |
| AUTH-FP-002 | Integration | API | User doesn’t exist | Unknown email | Call forgot-password | 200 generic response |

### A6. `POST /api/auth/reset-password/:token`
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-RP-001 | Integration | API | Valid reset token | New strong password | Reset password using token | 200; password hashed; token cleared |
| AUTH-RP-002 | Integration | API | Expired token | Expired token | Reset with expired token | 400/404 |

### A7. `GET /api/auth/me` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-ME-001 | Integration | API | None | No token | Call `/me` without Authorization header | 401 |
| AUTH-ME-002 | Integration | API | Invalid/expired JWT | Invalid token | Call `/me` | 401 |
| AUTH-ME-003 | Integration | API | Valid JWT | Valid token | Call `/me` | 200; returns user profile (no password) |

### A8. `PUT /api/auth/profile` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-PR-001 | Integration | API | Valid JWT | Valid profile fields | Update profile | 200; fields updated |
| AUTH-PR-002 | Integration | API | Valid JWT | Invalid fields | Bad phone/email format | 400 validation |

### A9. `PUT /api/auth/change-password` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| AUTH-CP-001 | Integration | API | Valid JWT | Valid current/desired fields | Change password | 200; password updated |
| AUTH-CP-002 | Integration | API | Valid JWT | Invalid/weak password | Weak new password | 400 validation |

---

## B) Complaints Routes — `/api/complaints/*`

### B1. `GET /api/complaints/nearby` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-N-001 | Integration | API | None | Missing token | Call without token | 401 |
| CMP-N-002 | Integration | API | Valid JWT | Valid token | Call nearby | 200; nearby complaints payload |

### B2. `GET /api/complaints/heatmap` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-H-001 | Integration | API | None | Missing token | Call heatmap | 401 |
| CMP-H-002 | Integration | API | Valid JWT | Valid token | Call heatmap | 200; heatmap with points/categories |

### B3. `GET /api/complaints` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-LIST-001 | Integration | API | Valid JWT | Citizen | Call list | 200; only allowed data |
| CMP-LIST-002 | Integration | API | Valid JWT | Admin | Call list | 200; admin sees expected dataset |
| CMP-LIST-003 | Integration | API | Invalid JWT | invalid token | Call list | 401 |

### B4. `POST /api/complaints` (protect + authorize('citizen') + upload.fields)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-CRT-001 | Integration | API | Citizen verified | Minimal payload | Title+description; no media | 201; complaint pending |
| CMP-CRT-002 | Integration | API | Citizen verified | Images <= 5 | Upload 1..5 images under `images` | 201; images saved |
| CMP-CRT-003 | Integration | API | Citizen verified | Images > 5 | Upload 6 images | 400 multer limit |
| CMP-CRT-004 | Integration | API | Citizen verified | Videos <= 2 | Upload 1..2 under `videos` | 201; videos saved |
| CMP-CRT-005 | Integration | API | Citizen verified | Videos > 2 | Upload 3 videos | 400 multer limit |
| CMP-CRT-006 | Integration | API | Non-citizen JWT | Forbidden role | Call with admin/department token | 403 |
| CMP-CRT-007 | Integration | API | Citizen verified | Invalid file type | Upload unsupported mime | 400/415 |

### B5. `GET /api/complaints/:id` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-ID-001 | Integration | API | Valid JWT | Valid ObjectId | Call with existing id | 200; complaint returned |
| CMP-ID-002 | Integration | API | Valid JWT | Non-ObjectId | Call with 'abc' | 400/404 |
| CMP-ID-003 | Integration | API | Valid JWT | Nonexistent ObjectId | Call with random valid ObjectId | 404 |

### B6. `PUT /api/complaints/:id/status` (protect + authorize('admin','department'))
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-STS-001 | Integration | API | Admin JWT | Valid status payload | Update status | 200; status + timeline updated |
| CMP-STS-002 | Integration | API | Department JWT | Valid status payload | Update status | 200 |
| CMP-STS-003 | Integration | API | Citizen JWT | Forbidden role | Call status update | 403 |

### B7. `PUT /api/complaints/:id/assign` (protect + authorize('admin'))
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-ASG-001 | Integration | API | Admin JWT | Valid dept id | Assign complaint to department | 200; assignedTo updated |
| CMP-ASG-002 | Integration | API | Non-admin JWT | Forbidden role | Call assign endpoint | 403 |
| CMP-ASG-003 | Integration | API | Admin JWT | Invalid dept id | Assign to bad id | 400/404 |

### B8. `POST /api/complaints/:id/upvote` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-UP-001 | Integration | API | Valid JWT | First upvote | Upvote complaint | 200; upvoteCount increments |
| CMP-UP-002 | Integration | API | Valid JWT | Toggle off | Upvote again | 200; upvote removed |
| CMP-UP-003 | Integration | API | Invalid JWT | invalid | Call upvote | 401 |

### B9. `POST /api/complaints/:id/comment` (protect)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| CMP-CMT-001 | Integration | API | Citizen JWT | Valid comment | Submit comment | 201; comment created |
| CMP-CMT-002 | Integration | API | Citizen JWT | Empty text | text='' | 400 validation |
| CMP-CMT-003 | Integration | API | Citizen JWT | Anonymous flag true | isAnonymous=true | 201; comment saved anonymously |

---

## C) Department Routes — `/api/department/*`

### C1. `GET /api/department/assigned` (protect + authorize('department'))
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| DEP-A-001 | Integration | API | None | Missing token | Call assigned | 401 |
| DEP-A-002 | Integration | API | Citizen/Admin JWT | Forbidden role | Call assigned | 403 |
| DEP-A-003 | Integration | API | Department JWT | Valid dept user | Call assigned | 200; returns assigned list |

### C2. `GET /api/department/performance` (protect + authorize('department'))
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| DEP-PF-001 | Integration | API | Department JWT | Call performance | 200; metrics schema returned |

### C3. `PUT /api/department/complaints/:id/accept` (department)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| DEP-ACC-001 | Integration | API | Department JWT | Accept pending complaint | 200; status updated + timeline |
| DEP-ACC-002 | Integration | API | Wrong role | Call accept | 403 |

### C4. `PUT /api/department/complaints/:id/reject` (department)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| DEP-REJ-001 | Integration | API | Department JWT | Reject | 200; status rejected |

### C5. `PUT /api/department/complaints/:id/progress` (upload.array('proofImages',5))
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| DEP-PRG-001 | Integration | API | Department JWT | proofImages 1..5 | Upload 1..5 files | 200; progress updated + proofs saved |
| DEP-PRG-002 | Integration | API | Department JWT | proofImages >5 | Upload 6 files | 400 multer limit |
| DEP-PRG-003 | Integration | API | Department JWT | proofImages invalid type | Unsupported mime | 400/415 |

### C6. `PUT /api/department/complaints/:id/complete`
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| DEP-COMP-001 | Integration | API | Department JWT | Complete complaint | 200; status resolved/closed; resolvedAt |

---

## D) Admin Routes — `/api/admin/*`

### D1. `GET /api/admin/dashboard` (admin)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ADM-DAS-001 | Integration | API | Citizen JWT | Call dashboard | 403 |
| ADM-DAS-002 | Integration | API | Admin JWT | Call dashboard | 200; analytics summary |

### D2. `GET /api/admin/analytics` (admin)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ADM-AN-001 | Integration | API | Admin JWT | Call analytics | 200; charts data |

### D3. `GET /api/admin/complaints` (admin)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ADM-CMP-001 | Integration | API | Admin JWT | Call complaints list | 200; returns all expected |

### D4. `GET /api/admin/sla` (admin)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ADM-SLA-001 | Integration | API | Admin JWT | Call SLA | 200; includes breached items |

### D5. `GET /api/admin/users` (admin)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ADM-US-001 | Integration | API | Admin JWT | Call users | 200; list of users |

### D6. `PUT /api/admin/users/:id/block` (admin)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| ADM-BLK-001 | Integration | API | Admin JWT | Valid user id | Block user | 200; isBlocked=true |
| ADM-BLK-002 | Integration | API | Admin JWT | Valid user id | Unblock user | 200; isBlocked=false |
| ADM-BLK-003 | Integration | API | Admin JWT | Invalid id | Block with bad id | 400/404 |

### D7. `POST /api/admin/users/department` (admin)
| TC-ID | Type | Area | Preconditions | Input Type | Steps | Expected Result |
|---|---|---|---|---|---|---|
| ADM-DPU-001 | Integration | API | Admin JWT | Create dept user | Create department user | 201; user created with role=department |

### D8. Departments CRUD — `/api/admin/departments*`
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ADM-DPR-001 | Integration | API | Admin JWT | GET departments | 200; list |
| ADM-DPR-002 | Integration | API | Admin JWT | POST department | 201; created; unique name enforced |
| ADM-DPR-003 | Integration | API | Admin JWT | PUT department | 200; updated |
| ADM-DPR-004 | Integration | API | Admin JWT | GET dept/:id/users | 200; returns department users |

---

## E) Notifications — `/api/notifications/*`

### E1. `GET /api/notifications` (protect)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| NOT-GET-001 | Integration | API | None | No token | 401 |
| NOT-GET-002 | Integration | API | Valid JWT | Get notifications | 200; only current user notifications |

### E2. `PUT /api/notifications/read-all` (protect)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| NOT-RA-001 | Integration | API | Unread exist | Mark all read | 200; all isRead=true |

### E3. `PUT /api/notifications/:id/read` (protect)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| NOT-R-001 | Integration | API | Own notification | Mark read | 200; updated isRead=true |
| NOT-R-002 | Integration | API | Someone else’s id | Attempt mark read | 404/403; no change |

---

## F) AI Routes — `/api/ai/*` (protect)

### F1. `POST /api/ai/classify`
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| AI-CLS-001 | Integration | API | Valid JWT | Submit complaint text | 200 with category/priority; if key missing => mock |
| AI-CLS-002 | Integration | API | None | No token | 401 |
| AI-CLS-003 | Integration | API | Valid JWT | Empty text | 400/200 depending on controller; should not crash |

### F2. `POST /api/ai/suggest`
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| AI-SUG-001 | Integration | API | Valid JWT | Submit partial text | 200 suggestion |
| AI-SUG-002 | Integration | API | Valid JWT | Invalid payload | 400 validation |

### F3. `POST /api/ai/chatbot`
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| AI-CHAT-001 | Integration | API | Valid JWT | Send messages payload | 200 assistant response |
| AI-CHAT-002 | Integration | API | Valid JWT | Empty/invalid messages | 400/handled error; no server crash |
| AI-CHAT-003 | Integration | API | No token | Call chatbot | 401 |

---

## Notes
- This expanded table is aligned with the actual route definitions from:
  - `server/routes/auth.js`
  - `server/routes/complaints.js`
  - `server/routes/admin.js`
  - `server/routes/department.js`
  - `server/routes/notifications.js`
  - `server/routes/ai.js`
- If you want, I can also generate:
  1) **separate .md per route group** (Auth/Complaints/Admin/Department/Notifications/AI)
  2) **form test-case files per UI page**

