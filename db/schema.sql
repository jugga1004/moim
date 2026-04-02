PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    NOT NULL UNIQUE,
    display_name TEXT    NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    is_active    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS meetings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    meeting_date TEXT    NOT NULL,
    location     TEXT,
    location_lat REAL,
    location_lng REAL,
    total_cost   INTEGER DEFAULT 0,
    description  TEXT,
    ai_story     TEXT,
    ai_summary   TEXT,
    topics       TEXT    DEFAULT '[]',
    created_by   INTEGER NOT NULL REFERENCES users(id),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);

CREATE TABLE IF NOT EXISTS photos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id    INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    filename      TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    file_path     TEXT    NOT NULL,
    file_size     INTEGER,
    mime_type     TEXT,
    exif_taken_at TEXT,
    exif_lat      REAL,
    exif_lng      REAL,
    exif_make     TEXT,
    exif_model    TEXT,
    exif_raw      TEXT,
    uploaded_by   INTEGER NOT NULL REFERENCES users(id),
    uploaded_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_photos_meeting ON photos(meeting_id, sort_order);

CREATE TABLE IF NOT EXISTS expense_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id  INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    item_name   TEXT    NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    unit_price  INTEGER NOT NULL DEFAULT 0,
    total_price INTEGER NOT NULL DEFAULT 0,
    category    TEXT,
    source      TEXT    NOT NULL DEFAULT 'manual' CHECK(source IN ('manual', 'ai_receipt')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id    INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    filename      TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    file_path     TEXT    NOT NULL,
    ai_raw_text   TEXT,
    processed     INTEGER NOT NULL DEFAULT 0,
    uploaded_by   INTEGER NOT NULL REFERENCES users(id),
    uploaded_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audio_files (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id       INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    filename         TEXT    NOT NULL,
    original_name    TEXT    NOT NULL,
    file_path        TEXT    NOT NULL,
    file_size        INTEGER,
    transcript       TEXT,
    summary          TEXT,
    topics_extracted TEXT    DEFAULT '[]',
    processed        INTEGER NOT NULL DEFAULT 0,
    uploaded_by      INTEGER NOT NULL REFERENCES users(id),
    uploaded_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    author_id  INTEGER NOT NULL REFERENCES users(id),
    content    TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_meeting ON comments(meeting_id, created_at);

CREATE TABLE IF NOT EXISTS meeting_members (
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    PRIMARY KEY (meeting_id, user_id)
);

CREATE TRIGGER IF NOT EXISTS meetings_updated_at
    AFTER UPDATE ON meetings
    BEGIN
        UPDATE meetings SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS comments_updated_at
    AFTER UPDATE ON comments
    BEGIN
        UPDATE comments SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
