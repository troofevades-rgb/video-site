# 1) Confirm what's in the file now (you'll see SQL lines)
Get-Content lib\cf.ts -TotalCount 10

# 2) Delete the wrong file
Remove-Item lib\cf.ts -Force

# 3) Recreate lib\cf.ts with the correct TypeScript
@'
export type Env = {
  WASABI_ENDPOINT: string;
  WASABI_REGION: string;
  WASABI_BUCKET: string;
  WASABI_KEY: string;
  WASABI_SECRET: string;
  DAILY_UPLOAD_BYTES?: string;
  MAX_FILE_BYTES?: string;
  VIDEOS_DB: D1Database; // Cloudflare D1 binding
};
'@ | Set-Content lib\cf.ts -Encoding UTF8

# 4) Make sure schema.sql has the SQL (and only there)
Get-Content schema.sql -TotalCount 5

# If schema.sql is empty or wrong, rewrite it:
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

