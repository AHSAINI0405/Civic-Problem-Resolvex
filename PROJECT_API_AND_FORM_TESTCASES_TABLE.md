# Resolvex — Project Test Cases (API + Forms) — Table Format

> Source of truth: the repository documentation under `API_AND_FORM_TEST_CASES.md` (if present) and the project flow/ERD docs. This document converts the test coverage into **proper table-ready format** for the **whole project APIs and forms**.

## Legend
- **Type**: Unit / Integration / System / E2E / UI
- **Area**: API / Form / Workflow
- **TC**: Test Case ID

---

## A) Authentication Test Cases (API)

| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-AUTH-001 | Integration | API | Email not registered | Register with `{ name, email, password, role? }` | Success, user created, verification token generated (if configured) |
| TC-AUTH-002 | Integration | API | Duplicate email exists | Register again with same email | Error (400/409), duplicate rejected |
| TC-AUTH-003 | Integration | API | Citizen exists and verified (or verification enabled) | Login with correct email/password | 200 + JWT returned, token contains claims used by middleware |
| TC-AUTH-004 | Integration | API | User exists but `isVerified=false` | Login with valid credentials | Rejected with `EMAIL_NOT_VERIFIED`-like error |
| TC-AUTH-005 | Integration | API | User exists | Login with wrong password | 400/401 error, no JWT |
| TC-AUTH-006 | Integration | API | User exists & unverified | Resend verification with `{ email }` | Success, new verification token stored; email attempted if configured |
| TC-AUTH-007 | Integration | API | Valid verification token exists and unexpired | `GET /api/auth/verify-email/:token` | Account activated `isVerified=true`; token invalidated/cleared |
| TC-AUTH-008 | Integration | API | Expired/invalid token | Verify email with invalid token | 400/404 with invalid/expired token message |
| TC-AUTH-009 | Integration | API | User exists | `POST /api/auth/forgot-password` with `{ email }` | Success; reset token/expiry stored; reset email attempted if configured |
| TC-AUTH-010 | Integration | API | Valid reset token exists | `POST /api/auth/reset-password/:token` | Password updated & hashed; token cleared |
| TC-AUTH-011 | Integration | API | None | Call protected route without token | 401 Unauthorized |
| TC-AUTH-012 | Integration | API | None | Call protected route with invalid/expired JWT | 401 Unauthorized |
| TC-AUTH-013 | Integration | API | Valid JWT | `GET /api/auth/me` | Returns current user profile, excludes sensitive fields |
| TC-AUTH-014 | Integration | API | Valid JWT | `PUT /api/auth/profile` with supported fields | Profile updated; validation errors returned for invalid input |
| TC-AUTH-015 | Integration | API | Valid JWT | `PUT /api/auth/change-password` | Password updated & hashed |

---

## B) Complaint API Test Cases (API)

### B1) Map/Insights
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-CMP-001 | Integration | API | None | `GET /api/complaints/nearby` without token | 401 Unauthorized |
| TC-CMP-002 | Integration | API | Valid JWT | `GET /api/complaints/heatmap` | 200 + heatmap payload with expected shape |

### B2) Create Complaint (with uploads)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-CMP-003 | Integration | API | Citizen JWT | `POST /api/complaints` with title/description | 201/200; complaint stored with status `pending`; timeline created |
| TC-CMP-004 | Integration | API | Citizen JWT | Upload <=5 images in `images`, call create | Success; media saved (Cloudinary URLs/IDs) |
| TC-CMP-005 | Integration | API | Citizen JWT | Upload 6 images in `images` | 400 (multer limit/validation error) |
| TC-CMP-006 | Integration | API | Citizen JWT | Upload <=2 videos in `videos`, call create | Success; `videos[]` saved |
| TC-CMP-007 | Integration | API | Department/Admin JWT | Attempt to create complaint while role forbidden | 403 Forbidden (authorize('citizen') fails) |

### B3) Retrieve Complaints
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-CMP-008 | Integration | API | Any valid JWT | `GET /api/complaints` | 200 + list; items comply with visibility/role rules |
| TC-CMP-009 | Integration | API | Existing complaint id | `GET /api/complaints/:id` | 200 + complaint document |
| TC-CMP-010 | Integration | API | Invalid id format | Call with non-ObjectId string | 400/404 with proper message |

### B4) Workflow Actions
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-CMP-011 | Integration | API | Admin/Dept JWT | `PUT /api/complaints/:id/status` | Status updated; timeline appended |
| TC-CMP-012 | Integration | API | Citizen JWT | Call status update endpoint | 403 Forbidden |
| TC-CMP-013 | Integration | API | Admin JWT | `PUT /api/complaints/:id/assign` with department id | assignedTo set; assignedAt set; workflow changes if applicable |
| TC-CMP-014 | Integration | API | Non-admin JWT | Call assign endpoint | 403 Forbidden |
| TC-CMP-015 | Integration | API | Valid JWT | `POST /api/complaints/:id/upvote` | Upvote applied/toggled; count/array updated |
| TC-CMP-016 | Integration | API | User already upvoted | Upvote again | Upvote removed or toggled correctly |
| TC-CMP-017 | Integration | API | Valid JWT | `POST /api/complaints/:id/comment` with `{text,isAnonymous?}` | Comment created; associated to complaint and user |

---

## C) Department API Test Cases

| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-DEP-001 | Integration | API | Citizen JWT | `GET /api/department/assigned` | 403 Forbidden |
| TC-DEP-002 | Integration | API | Department JWT + pending complaint | `PUT /api/department/complaints/:id/accept` | Status transitions allowed; timeline updated; SLA deadline set if applicable |
| TC-DEP-003 | Integration | API | Department JWT | `PUT /api/department/complaints/:id/reject` | Status rejected; timeline updated |
| TC-DEP-004 | Integration | API | Department JWT | `PUT /api/department/complaints/:id/progress` with proofImages <=5 | Status updated; proofImages saved |
| TC-DEP-005 | Integration | API | Department JWT | proofImages >5 | 400 multer limit error |
| TC-DEP-006 | Integration | API | Department JWT | `PUT /api/department/complaints/:id/complete` | Status resolved/closed; resolvedAt set |
| TC-DEP-007 | Integration | API | Wrong role (admin/citizen) | Call dept endpoints | 403 Forbidden |

---

## D) Admin API Test Cases

| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ADM-001 | Integration | API | Citizen JWT | `GET /api/admin/dashboard` | 403 Forbidden |
| TC-ADM-002 | Integration | API | Admin JWT | `GET /api/admin/dashboard` | 200 with analytics metrics |
| TC-ADM-003 | Integration | API | Admin JWT | `GET /api/admin/analytics` | 200 with analytics schema |
| TC-ADM-004 | Integration | API | Admin JWT | `GET /api/admin/complaints` | 200 with complaints list |
| TC-ADM-005 | Integration | API | Admin JWT | `GET /api/admin/sla` | 200 with SLA breach stats |
| TC-ADM-006 | Integration | API | Admin JWT | `GET /api/admin/users` | 200 with users list |
| TC-ADM-007 | Integration | API | Admin JWT | `PUT /api/admin/users/:id/block` | isBlocked toggled/updated |
| TC-ADM-008 | Integration | API | Admin JWT | `POST /api/admin/users/department` | Department user created & linked |
| TC-ADM-009 | Integration | API | Admin JWT | Departments CRUD: list/create/update/users | All endpoints behave correctly; uniqueness rules enforced |

---

## E) Notifications API Test Cases

| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-NOTIF-001 | Integration | API | None | `GET /api/notifications` without token | 401 Unauthorized |
| TC-NOTIF-002 | Integration | API | Logged-in user | `GET /api/notifications` | Only notifications for current user |
| TC-NOTIF-003 | Integration | API | Unread notifications exist | `PUT /api/notifications/read-all` | All become `isRead=true` |
| TC-NOTIF-004 | Integration | API | Notification exists | `PUT /api/notifications/:id/read` | Selected notification marked read |
| TC-NOTIF-005 | Integration | API | Notification id belongs to other user | Mark read attempt | 404/403 and no update |

---

## F) AI API Test Cases

| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-AI-001 | Integration | API | Valid JWT | `POST /api/ai/classify` | 200 with classification; if key missing => mock formatted response |
| TC-AI-002 | Integration | API | Valid JWT | `POST /api/ai/suggest` | 200 with suggestion response |
| TC-AI-003 | Integration | API | Valid JWT | `POST /api/ai/chatbot` | 200 assistant response; handles empty input gracefully |
| TC-AI-004 | Integration | API | None | Call any `/api/ai/*` without token | 401 |

---

## G) Form/UI Test Cases (Citizen + Admin + Dept)

### G1) Raise Complaint Form
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-FORM-RC-001 | UI | Form | Citizen logged in | Submit empty form | Inline validation + no successful API call |
| TC-FORM-RC-002 | E2E | Form | Citizen logged in | Submit valid title/description without media | Complaint created, status pending, timeline created |
| TC-FORM-RC-003 | E2E | Form | Citizen logged in | Upload 5 images and submit | Success; media attached |
| TC-FORM-RC-004 | UI negative | Form | Citizen logged in | Upload 6 images and submit | UI blocks or API returns error |
| TC-FORM-RC-005 | UI | Form | Citizen logged in | Submit invalid location fields (if required) | Validation error |
| TC-FORM-RC-006 | E2E | Form | Citizen logged in | Upload 2 videos and submit | Success; videos saved |

### G2) Complaint Detail (Upvote / Comment)
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-FORM-CD-001 | E2E | UI | Citizen logged in | Upvote from `/complaints/:id` | Upvote count updates |
| TC-FORM-CD-002 | UI negative | Form | Citizen logged in | Submit empty comment | Validation error |
| TC-FORM-CD-003 | E2E | Form | Citizen logged in | Submit anonymous comment (if checkbox exists) | Comment stored with `isAnonymous=true` |

### G3) Notifications Page
| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-FORM-NOT-001 | UI/E2E | UI | Logged in user | Open notifications UI | Shows only that user’s notifications |
| TC-FORM-NOT-002 | E2E | UI | Unread notifications exist | Click Mark all read | Unread count becomes 0 |

---

## H) End-to-End System-Level Test Cases

| TC-ID | Type | Area | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-E2E-001 | E2E | Workflow | Citizen exists | Login → Raise complaint → View detail → Upvote + comment | All steps succeed; states remain consistent |
| TC-E2E-002 | E2E | Workflow | Admin exists | Login → Dashboard/analytics/complaints/SLA → Block a user → Manage department | RBAC enforcement + CRUD correctness |
| TC-E2E-003 | E2E | Workflow | Department exists | Login → Accept complaint → Progress with proofs → Complete complaint | Workflow timeline + proof uploads update correctly |

---

## Notes for Consistency
- If your repository has slight differences in endpoint naming, update the Steps/Expected Result rows accordingly.
- File upload limits are assumed from documented constraints:
  - complaint creation: `images` max 5, `videos` max 2
  - progress proofs: `proofImages` max 5


