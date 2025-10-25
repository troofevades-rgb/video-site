@'
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  s3_key TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  size_bytes INTEGER,
  content_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_videos (
  post_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  PRIMARY KEY (post_id, video_id)
);

CREATE TABLE IF NOT EXISTS quotas (
  id INTEGER PRIMARY KEY,
  daily_upload_bytes INTEGER DEFAULT 53687091200
);
INSERT OR IGNORE INTO quotas (id) VALUES (1);
'@ | Set-Content schema.sql -Encoding UTF8
