-- Clarence Golf Platform — PostgreSQL schema
-- Run this once against the Render PostgreSQL database
-- DATABASE_URL: postgresql://golf_db_u3if_user:...@dpg-d956bn8k1i2s739qsii0-a.ohio-postgres.render.com/golf_db_u3if

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  pin_hash    TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login  TIMESTAMPTZ
);

-- ─── COURSES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id          TEXT PRIMARY KEY,           -- slug e.g. 'cog-hill-4'
  name        TEXT NOT NULL,
  city        TEXT,
  state       TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  par         INT,
  rating18    DOUBLE PRECISION,
  slope18     INT,
  rating9     DOUBLE PRECISION,
  slope9      INT,
  holes_count INT NOT NULL DEFAULT 18,
  source      TEXT DEFAULT 'seed',        -- seed | golf_api | usga | user
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COURSE HOLES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_holes (
  id          SERIAL PRIMARY KEY,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  hole_num    INT NOT NULL,  -- 1-18
  par         INT NOT NULL,
  yards_blue  INT,
  yards_white INT,
  yards_red   INT,
  hdcp        INT,           -- handicap stroke index
  UNIQUE(course_id, hole_num)
);

-- ─── COURSE TEES ──────────────────────────────────────────────
-- Real courses have multiple tee sets (Blue/White/Gold/Red, etc.), each
-- with its own rating/slope and per-hole yardage. A single course-level
-- rating18/slope18 (as on `courses`) is only ever correct for whichever
-- tee that happened to be recorded from — using it unconditionally for
-- every round misrepresents WHS differentials for anyone playing a
-- different tee. These tables let a course carry N named tees, each with
-- its own hole-by-hole yardage, so the player can pick the one they
-- actually played.
CREATE TABLE IF NOT EXISTS course_tees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,             -- e.g. 'Blue', 'Championship'
  gender      TEXT,                      -- 'male' | 'female' | null
  rating18    DOUBLE PRECISION,
  slope18     INT,
  rating9     DOUBLE PRECISION,
  slope9      INT,
  holes_count INT NOT NULL DEFAULT 18,
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE(course_id, name)
);

CREATE TABLE IF NOT EXISTS course_tee_holes (
  tee_id      UUID NOT NULL REFERENCES course_tees(id) ON DELETE CASCADE,
  hole_num    INT NOT NULL,
  par         INT NOT NULL,
  yardage     INT,
  hdcp        INT,
  PRIMARY KEY (tee_id, hole_num)
);

-- ─── CLUBS CATALOG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs_catalog (
  id          TEXT PRIMARY KEY,
  brand       TEXT NOT NULL,
  family      TEXT NOT NULL,
  model       TEXT NOT NULL,
  year        INT NOT NULL,
  type        TEXT NOT NULL,             -- driver|fw|hybrid|iron|wedge|putter
  category    TEXT NOT NULL,             -- blade|players_cb|players_distance|game_improvement|max_gi|standard
  stock_shaft TEXT,
  stock_loft  DOUBLE PRECISION,          -- driver/fw/wedge
  stock_7i_loft DOUBLE PRECISION,        -- iron sets
  carry_base  INT,                       -- reference carry (yards)
  source      TEXT DEFAULT 'seed',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ROUNDS ───────────────────────────────────────────────────
-- course_id is NOT a foreign key: rounds can be logged against courses
-- found live via the Golf Course API or seed data that are never persisted
-- into the `courses` table. course_name is the denormalized source of truth.
CREATE TABLE IF NOT EXISTS rounds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   TEXT,
  course_name TEXT NOT NULL,             -- denormalized for display
  date        DATE NOT NULL,
  holes       INT NOT NULL DEFAULT 18,   -- 9 or 18
  score       INT NOT NULL,
  round_type  TEXT NOT NULL DEFAULT 'solo', -- solo | scramble — WHS only allows solo stroke play for handicap
  course_rating DOUBLE PRECISION,
  slope_rating  INT,
  putts       INT,
  fir         INT,                       -- fairways in regulation
  fir_total   INT,                       -- total fairways
  gir         INT,                       -- greens in regulation
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop the FK constraint if it already exists on a previously-migrated database
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_course_id_fkey;
-- Add round_type to a previously-migrated database that predates this column
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS round_type TEXT NOT NULL DEFAULT 'solo';

-- ─── ROUND HOLES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS round_holes (
  id          SERIAL PRIMARY KEY,
  round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  hole_num    INT NOT NULL,
  par         INT,
  score       INT NOT NULL,
  putts       INT,
  fir         BOOLEAN,
  gir         BOOLEAN,
  UNIQUE(round_id, hole_num)
);

-- ─── BAG CLUBS (per user) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS bag_clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_id  TEXT REFERENCES clubs_catalog(id),
  slot        TEXT NOT NULL,             -- driver|3w|5w|3h|4h|3i...PW|GW|SW|LW|putter
  brand       TEXT,                      -- if custom/not in catalog
  model       TEXT,
  carry       INT,                       -- user-measured carry
  carry_is_estimate BOOLEAN NOT NULL DEFAULT TRUE,
  loft        DOUBLE PRECISION,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slot)
);

-- ─── AGENT CACHE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_cache (
  key         TEXT PRIMARY KEY,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds INT NOT NULL DEFAULT 86400
);

-- ─── CHAT SESSIONS / ARCHIVE ────────────────────────────────────
-- A session is created lazily on the first message of a conversation.
-- Starting a "new chat" just means the client stops sending that
-- session's id, so the next message creates a fresh one — the old
-- session simply becomes part of the archive.
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,             -- user | assistant
  content     TEXT NOT NULL,
  tools_used  TEXT[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USER DOCUMENTS (persistent chatbot knowledge) ─────────────
-- User-uploaded PDF/MD/text files (swing notes, lesson summaries, individual
-- performance data, etc). Extracted plain text is stored directly — Claude
-- pulls it via the get_user_document tool when it's relevant to the question,
-- the same pattern used for chat history.
CREATE TABLE IF NOT EXISTS user_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  content     TEXT NOT NULL,
  char_count  INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rounds_user_date ON rounds(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_round_holes_round ON round_holes(round_id);
CREATE INDEX IF NOT EXISTS idx_bag_clubs_user ON bag_clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_agent_cache_key ON agent_cache(key);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_documents_user ON user_documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_tees_course ON course_tees(course_id, sort_order);
