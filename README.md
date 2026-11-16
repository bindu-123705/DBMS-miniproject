# EvePort: club & event portal

Next.js 14 + **MySQL 8** (relational data) + **MongoDB** (notifications, media, comments).
PES University DBMS mini-project (Experiential Learning Level 3).

## Quick start
Requirements: Node 18+, MySQL 8, MongoDB 6+ (with `mongosh`).

```bash
npm install
cp .env.example .env.local          # edit passwords / JWT_SECRET if you changed them
bash scripts/setup-db.sh            # runs db/mysql/01..04 and db/mongo/eveport_mongodb.js
npm run dev                         # http://localhost:3000
```
Manual alternative: `mysql -u root -p < db/mysql/01_schema.sql` (then 02, 03, 04) and `mongosh < db/mongo/eveport_mongodb.js`.

### Demo logins (password `Password@123`)
| Role | Login |
|---|---|
| Admin | `lakshmi.rao@pes.edu` |
| Club head (Code Chronicles) | `aarav.sharma@pes.edu` |
| Student | `vikram.patil@pes.edu` or SRN `PES1UG22CS401` |
| Student (no club posts yet) | `PES1UG24CS102` |

## What each role can do
| | Student | Club head | Admin |
|---|---|---|---|
| Feed, like, comment (edit/delete own), notifications, profile | ✔ | ✔ | ✔ |
| Register / cancel for events | ✔ | ✔ | ✔ |
| Post in a club they belong to | goes to **pending** | published at once | published at once |
| Approve / reject / archive posts of own club | | ✔ | ✔ |
| Add / remove members, create events, mark attendance | | own club | any club |
| Reports | | ✔ | ✔ |
| Create users and clubs, reset passwords, delete users | | | ✔ |

## Architecture
```
Browser (Next.js pages) ─► middleware.js (JWT cookie gate, role redirect)
        │
        ▼
  app/api/** route handlers  ── lib/auth.js route(roles, handler) → 401/403
        │                          │
        ├─ MySQL via lib/mysql.js  └─ MongoDB via lib/mongo.js
        │    one pool PER ROLE, each a different MySQL account
        │    (ep_student / ep_head / ep_admin / ep_auth)
        │    business rules live in procedures + triggers
```
**Three layers of access control**: (1) Next.js middleware redirects pages by role; (2) every API route declares its allowed roles; (3) MySQL itself: the student account cannot `DELETE FROM CLUB` or read `password_hash`, and procedures like `sp_review_post` re-check that the caller is the club head.

## Repository layout
```
db/mysql/   01_schema  02_seed  03_routines (functions, procedures, triggers, view)
            04_rbac (roles + accounts)  05_queries (DML, joins, nested, correlated, recursive CTE)
db/mongo/   eveport_mongodb.js (validators, indexes, seed, RUD examples, $graphLookup)
app/        pages (feed, clubs, events, notifications, profile, reports, admin, login)
app/api/    REST endpoints
lib/        mysql.js (per-role pools) · mongo.js · auth.js (JWT, route guard, error mapping)
docs/       DESIGN.md (ER, schema, technology justification, rubric mapping)
```

## Database features to demo (viva cheat-sheet)
| Feature | Where | Try it |
|---|---|---|
| Functions | `fn_like_count`, `fn_seats_left`, `fn_club_member_count`, `fn_can_manage_club` | `SELECT fn_seats_left(5);` |
| Procedures | `sp_register_for_event` (transaction + row lock), `sp_toggle_like`, `sp_create_post`, `sp_review_post`, `sp_finalize_event` (**cursor**), … | register for a full event in the UI |
| Triggers | capacity check, auto-PROFILE, head auto-member + role promotion, head protection, event-creator check, post-status audit | admin creates a club → head becomes `club_head`; `SELECT * FROM AUDIT_LOG;` after approving a post |
| CTE / recursive CTE | Reports page (`app/api/reports`) and `05_queries.sql` §E–F | Reports → "Upcoming calendar" |
| Nested / correlated | `05_queries.sql` §C–D | Reports → "above average" |
| DB-level RBAC | `04_rbac.sql` | `mysql -u ep_student -p eveport -e "DELETE FROM CLUB"` → denied |
| Mongo RUD | comments (edit/delete own, replies cascade), notifications (mark read / delete), media | Feed → 💬; Notifications page |
| Mongo recursion | `$graphLookup` in the Mongo script | `mongosh` section 7 |

## Troubleshooting
* *"Access denied for user ep_student"*: run `04_rbac.sql`, or point all four `DB_*` variables in `.env.local` at one MySQL user.
* *Notifications / comments empty*: MongoDB is not running or `eveport_mongodb.js` was not loaded. Core MySQL actions still work; notifications fail silently by design.
* Event registration only works for events in the future; seed events dated before today appear under **Past**. Create a new event as a club head to test registration.
