# Glint — Self-Hosted Photo Gallery for Photographers

## Project Overview

Build **Glint**, an open-source, self-hosted photo gallery web application designed for photographers (technical and non-technical) who want to showcase their work online in minutes, not hours.

**Core positioning:** Unlike existing self-hosted photo tools (Immich, Piwigo, Lychee, LibrePhotos) which optimize for personal photo *management* (search, face recognition, deduplication), Glint optimizes for **zero-friction setup and a beautiful public showcase**. The target user is a photographer who wants to run one command and have a shareable public gallery — not a photo librarian who wants ML-powered organization.

**Definition of done for v1:** A user can run a single Docker Compose command with zero `.env` editing, log into the admin panel, upload photos into an album, and get a public shareable link — all within 5 minutes, with no terminal knowledge beyond the initial `docker compose up`.

---

## Explicit Scope

### IN scope for MVP
- Single admin account with login-protected upload/management panel
- Drag-and-drop photo upload via web UI
- Album creation and management (title, description, cover photo, reordering)
- Public gallery pages: responsive grid view + animated lightbox viewer
- Basic EXIF metadata display (camera, lens, aperture, shutter speed, ISO)
- Public/private album toggle
- Password-protected albums (for private client sets)
- Anonymous public likes (no login required)
- Anonymous public comments (no login required) with AI-assisted moderation
- One-command Docker Compose deployment with sane baked-in defaults
- Local disk storage for images (no cloud storage dependency for MVP)
- Mobile-friendly, animated, distinctive public-facing design

### explicitly OUT of scope for MVP (resist scope creep)
- Face recognition / AI photo tagging / reverse image search
- Native mobile app (responsive web is sufficient)
- Multi-user or team accounts / role-based permissions
- RAW file processing or in-app photo editing
- Client proofing/selection workflows (e.g., "pick your favorites" for client delivery)
- Cloud storage (S3/R2) integration — can be a fast-follow, not MVP

---

## Tech Stack

- **Backend:** Node.js with Express (or Fastify)
- **Database:** SQLite (chosen deliberately over Postgres for MVP — see "Database Handling" section below)
- **ORM:** Drizzle ORM (lightweight, strong SQLite support, keeps dependency footprint small)
- **Image processing:** `sharp` for thumbnail generation and responsive image resizing on upload
- **Frontend:** Next.js (React)
- **Animation:** Framer Motion, used deliberately and sparingly (see "UI & Design Direction")
- **Storage:** Local disk, organized by album/photo ID, with generated thumbnail variants
- **Deployment:** Single Docker Compose file. Bundle frontend + backend into as few containers as possible to minimize setup complexity for non-technical users.
- **LLM API:** Anthropic Claude API (small/fast model) for comment moderation triage

---

## Admin Authentication

**Design principle:** Single-owner tool, so no signup flow, no user table complexity — just one protected identity that gates every mutating action.

- Admin credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) are set via environment variables at first run. Password is hashed (bcrypt or argon2) on startup/first use — never stored or compared in plaintext.
- Login page at `/admin/login` — simple username/password form, no "remember me" complexity needed for MVP.
- Session-based auth using a signed, HTTP-only cookie (or JWT stored in an HTTP-only cookie) issued on successful login.
- A `requireAdmin` middleware protects all mutating routes: album create/edit/delete, photo upload/delete/reorder, comment moderation actions, and the settings page.
- Public routes (viewing galleries, toggling likes, submitting comments) remain completely open — no auth check.
- Optional (fast-follow, not MVP-blocking): allow the admin to change their password from within the admin UI, persisted to a minimal `AdminUser` table instead of requiring an `.env` edit + restart. For v1, editing `.env` and restarting the container to change credentials is an acceptable trade-off for simplicity.

**New/updated API routes:**
- `POST /api/admin/login` — validate credentials, issue session cookie
- `POST /api/admin/logout` — clear session
- `GET /api/admin/me` — check current session validity (used by frontend to gate the admin UI)

---

## Database Handling

**What SQLite means concretely:** SQLite is not a separate service — it's a single file on disk (e.g., `data/glint.db`). The Node backend talks to it directly through Drizzle ORM. There is no database container to configure, no connection string, and no waiting for a DB service to become healthy before the app starts. This is central to the "zero config" promise: `docker compose up` should never require the user to wait on or configure a database.

**Schema & migrations:**
- Define all tables (Album, Photo, Like, Comment, Settings) as Drizzle schema code committed to the repo.
- On container startup, run an automatic migration step: if the database file doesn't exist or is missing tables, create them. This is what makes first-run setup truly zero-touch.
- Future schema changes ship as versioned migration files in the repo, so upgrading the app version also safely upgrades the database schema.

**Persistence in Docker:**
The SQLite file **must** live in a mounted Docker volume, not the container's ephemeral filesystem, or data is lost on every rebuild.

```yaml
volumes:
  - ./data:/app/data   # SQLite file + uploaded photos + thumbnails all live here
```

Both the `.db` file and uploaded photo files should sit under the same mounted volume, so a single host folder (`./data`) is the entire backup surface.

**Backups:**
Because everything is file-based, backup is simple — no `pg_dump`-style tooling needed.
- Periodically copy/zip the `./data` folder.
- Use SQLite's built-in `.backup` command for a safe, consistent snapshot while the app is running, rather than copying the raw `.db` file mid-write.

**Known limitation (acceptable for this use case):** SQLite handles concurrent reads well but serializes writes. This is a non-issue for a single-admin personal gallery with occasional public likes/comments — it is not intended to scale to multi-tenant or high-concurrency use.

---

## UI & Design Direction

**Design brief:** This is a photography portfolio tool — the photos are the content and the hero. The UI's job is to get out of the way and let images breathe, with one deliberate, well-executed moment of motion rather than animation scattered everywhere. Must be mobile-first responsive and feel distinctive, not like a generic template or SaaS-card kit.

### Color
- `#0A0A0B` — near-black background (photography sites favor dark backgrounds; images pop against it and it reads as "gallery," not "app")
- `#F5F5F0` — warm off-white for primary text and UI chrome
- `#8B8378` — muted warm grey for secondary text/metadata (captions, EXIF labels)
- `#C9A97E` — warm brass/gold accent, used sparingly: active like state and focus rings only. Never used decoratively or on large surfaces.

### Typography
- Display/headline (album titles): a serif with real character — e.g., Fraunces or a similar characterful serif. Avoid the generic Playfair-everywhere default.
- Body/UI (metadata, buttons, nav): a clean grotesque sans — e.g., Inter or General Sans.
- EXIF data specifically: rendered in monospace. This is the one justified use of monospace, since camera settings are literally data.
- Avoid: accenting a single word in a headline, all-caps labels, unnecessary eyebrow labels above content.

### Layout
- **Public album view:** full-bleed justified/masonry grid where photos keep their native aspect ratio — no forced square crops.
- **Desktop:** justified rows (like a print contact sheet), not a rigid uniform CSS grid — reads as curated rather than a Pinterest clone.
- **Mobile:** single column, generous vertical spacing, swipeable fullscreen lightbox.

```
Desktop:
┌─────────────────────────────────┐
│  Album Title (serif, large)      │
│  description · N photos          │
├───────────┬──────────┬───────────┤
│  photo    │  photo   │  photo    │  ← justified rows,
│           │          │           │     native aspect ratios
├───────────┴──────┬───┴───────────┤
│      photo        │    photo     │
└────────────────────┴─────────────┘

Mobile:
┌─────────────┐
│ Album Title  │
├─────────────┤
│    photo     │
├─────────────┤
│    photo     │
└─────────────┘
```

### The one animated moment
Per the "spend boldness in one place" principle: the lightbox open transition. When a photo is tapped/clicked, it should scale/morph from its position in the grid into the fullscreen lightbox (a shared-element transition using Framer Motion's layout animations), not just fade in a modal. This is the single "catchy," memorable interaction worth real engineering effort.

Everything else — hover states, the like button, the comment form — should be quiet, fast, and functional rather than heavily animated. Avoid fade-and-slide-up entrances on every section and hover transitions on every card; that reads as generic/templated rather than intentional.

Respect `prefers-reduced-motion`: fall back to a simple cross-fade for the lightbox transition when the user has that preference set.

### What to explicitly avoid
- Rounded-card-with-soft-shadow treatment on photos (the generic "SaaS card kit" look)
- All-caps eyebrow labels above albums
- Gradient washes as decoration
- Arrow ("→") appended to buttons or links
- Numbered markers (01/02/03) unless content is genuinely sequential

### Implementation notes for Claude Code
- Use CSS Grid (`grid-auto-flow: dense`) or a lightweight hand-rolled justified-gallery algorithm for the masonry layout — avoid pulling in a heavy third-party gallery library for this.
- Framer Motion is the one animation dependency worth its weight, used specifically for the lightbox shared-element transition.
- Build to a quality floor: responsive down to small mobile widths, visible keyboard focus states, accessible color contrast, and reduced-motion support — without calling special attention to any of it.

---

## Data Model

```
Album
 - id (uuid)
 - title (string)
 - slug (string, unique, url-safe)
 - description (text, nullable)
 - cover_photo_id (fk -> Photo.id, nullable)
 - is_public (bool, default true)
 - password_hash (string, nullable — set if album requires a password)
 - created_at, updated_at

Photo
 - id (uuid)
 - album_id (fk -> Album.id)
 - filename (string)
 - storage_path (string)
 - thumbnail_path (string)
 - width (int)
 - height (int)
 - exif_json (json, nullable — camera, lens, aperture, shutter speed, ISO, focal length)
 - sort_order (int)
 - uploaded_at

Like
 - id (uuid)
 - photo_id (fk -> Photo.id)
 - fingerprint (string — anonymous client identifier stored via cookie/localStorage)
 - created_at
 - UNIQUE constraint on (photo_id, fingerprint) — one like per fingerprint per photo, toggleable

Comment
 - id (uuid)
 - photo_id (fk -> Photo.id)
 - author_name (string, nullable)
 - body (text)
 - status (enum: pending | approved | rejected)
 - ai_verdict (enum: approve | reject | review, nullable)
 - ai_reason (text, nullable — one-sentence LLM explanation)
 - ai_flags (json array, nullable — e.g. ["spam", "harassment", "off-topic", "link-spam"])
 - fingerprint (string)
 - ip_hash (string — hashed, not raw IP, for spam pattern tracking)
 - created_at

Settings
 - site_title (string)
 - site_description (text)
 - theme (enum: light | dark)

AdminUser (optional — only if supporting in-UI password change; otherwise admin identity lives purely in env vars)
 - id
 - username
 - password_hash
```

---

## API Routes

### Auth
- `POST /api/admin/login` — validate credentials, issue session cookie
- `POST /api/admin/logout` — clear session
- `GET /api/admin/me` — check current session validity

### Albums
- `POST /api/albums` — create album (admin)
- `GET /api/albums` — list albums (admin: all; public: only is_public=true)
- `GET /api/albums/:slug` — public album view (checks password if set)
- `PATCH /api/albums/:id` — update album metadata (admin)
- `DELETE /api/albums/:id` — delete album (admin)
- `POST /api/albums/:id/reorder` — reorder photos within album (admin)

### Photos
- `POST /api/albums/:id/photos` — upload photo(s), multipart form data (admin)
- `DELETE /api/photos/:id` — delete photo (admin)

### Likes
- `POST /api/photos/:id/like` — toggle like using fingerprint cookie (public)
- `GET /api/photos/:id/likes` — get like count (public)

### Comments
- `POST /api/photos/:id/comments` — submit comment (public). Triggers async LLM moderation flow (see below).
- `GET /api/photos/:id/comments` — list approved comments only (public)
- `GET /api/admin/comments/pending` — moderation queue, pre-labeled with AI verdict/reason (admin)
- `PATCH /api/admin/comments/:id` — manually approve/reject a comment (admin)

---

## Comment Moderation Flow (LLM-Assisted)

**Design principle:** LLM-assisted, not LLM-autonomous. A human (the admin) remains the final authority for ambiguous cases, but the LLM absorbs the obvious spam/abuse cases so the admin never has to manually clear a flood of junk.

**Flow:**
1. Comment submitted via `POST /api/photos/:id/comments` → immediately saved with `status: pending`. Respond to the client **immediately** ("comment submitted, pending review") — do not block the HTTP response on the LLM call. This keeps the UX snappy.
2. Async job/background call sends the comment text to the Claude API with a structured moderation prompt (below).
3. Store the returned `ai_verdict`, `ai_reason`, and `ai_flags` on the comment record.
4. Apply routing logic:
   - `verdict: approve` → automatically set `status: approved`, comment becomes publicly visible
   - `verdict: reject` → automatically set `status: rejected`, never shown publicly, never enters admin queue (saves admin's time entirely)
   - `verdict: review` → remains `status: pending`, appears in the admin moderation queue pre-labeled with the AI's reasoning so the admin can decide in seconds instead of reading full context cold

**Moderation prompt template:**
```
You are moderating a comment on a photography portfolio site.
Comment: "{comment_text}"

Respond ONLY with JSON in this exact shape, no other text:
{
  "verdict": "approve" | "reject" | "review",
  "reason": "one sentence explanation",
  "flags": ["spam" | "harassment" | "off-topic" | "link-spam" | "none"]
}

Guidelines:
- reject: spam, harassment, hate speech, scams, irrelevant link-dropping
- review: ambiguous, borderline, sarcastic, or unclear intent
- approve: genuine, on-topic feedback about the photo
```

**Anti-abuse measures (independent of the LLM layer):**
- Honeypot field in the comment form (hidden input real users never fill in; bots typically do — instant reject if populated)
- Rate limiting per IP/fingerprint on both comment submission and like toggling
- `ip_hash` stored (not raw IP) for pattern detection without storing personally identifying raw IPs unnecessarily

---

## Deployment Requirements

- Single `docker-compose.yml` that works with `docker compose up` and **no required `.env` editing** — all defaults should work out of the box for local/demo use. Optional `.env` overrides for things like the Claude API key, admin credentials, custom port, or storage path.
- Document a recommended path for exposing the instance publicly using a Cloudflare Tunnel (no port-forwarding, free SSL) — include this as a clearly written README section, not required for local use.
- Provide a `.env.example` file listing all optional environment variables (e.g., `ANTHROPIC_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `PORT`, `STORAGE_PATH`, `SITE_TITLE`).
- Ensure the SQLite database file and uploaded photos are stored in a Docker volume so data persists across container restarts.

---

## Suggested Build Order (Milestones)

1. **Backend core:** Album and Photo CRUD, local file storage, thumbnail generation on upload (using `sharp`), EXIF extraction on upload.
2. **Admin auth:** Login/logout, session middleware, protect all mutating routes.
3. **Frontend admin:** Login screen, upload UI (drag-and-drop), album management screens, photo reordering.
4. **Frontend public:** Public gallery justified grid view, animated lightbox viewer, responsive images, EXIF display panel — following the UI & Design Direction above.
5. **Access control:** Public/private album toggle, password-protected album flow.
6. **Likes:** Anonymous fingerprint-based like toggle, like counts displayed on photos.
7. **Comments + LLM moderation:** Comment submission, async Claude API moderation call, auto-approve/reject/review routing, admin moderation queue UI.
8. **Docker packaging:** Finalize `docker-compose.yml`, `.env.example`, and ensure true one-command startup with no manual config required.
9. **Documentation:** README with setup instructions, screenshots, Cloudflare Tunnel guide, and a "why I built this" section.
10. **Dogfooding:** Deploy live for the project owner's own photography, using it as the real-world proof of concept before publishing the repo.

---

## Repository & Documentation Expectations

- Clear, well-organized README with:
  - Project description and screenshots
  - Quick-start instructions (`docker compose up` and nothing else required)
  - Configuration reference (`.env.example` explained)
  - Cloudflare Tunnel setup guide for going public
  - Architecture overview (brief)
  - License (MIT recommended for maximum adoption as a portfolio/open-source piece)
- Code should be clean and readable enough to serve as a portfolio artifact — this project will be linked from a personal developer portfolio site, so code quality and documentation quality both matter as much as functionality.
