// lib/db.ts
import { dev, VideoRow, PostRow } from "./devStore";

function hasD1(env: any) {
  return !!(env && env.VIDEOS_DB && typeof env.VIDEOS_DB.prepare === "function");
}

export async function getDB(env: any) {
  return hasD1(env) ? (env.VIDEOS_DB as any) : null; // <-- change D1Database to any
}

export async function listPosts(env: any) {
  const db = await getDB(env);
  if (!db) {
    // dev fallback: synthesize a posts list from the in-memory maps
    const out: any[] = [];
    for (const [, p] of dev.posts) {
      const vids = dev.postVideos.get(p.id);
      out.push({
        id: p.id,
        title: p.title,
        body: p.body || "",
        created_at: p.created_at || new Date().toISOString(),
        video_ids: vids ? Array.from(vids).join(",") : null
      });
    }
    // newest first
    out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return out;
  }

  const posts = await db.prepare(
    `SELECT p.id, p.title, p.body, p.created_at,
            GROUP_CONCAT(v.id) as video_ids
     FROM posts p
     LEFT JOIN post_videos pv ON pv.post_id = p.id
     LEFT JOIN videos v ON v.id = pv.video_id
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  ).all();
  return posts.results || [];
}

export async function insertPost(env: any, id: string, title: string, body: string) {
  const db = await getDB(env);
  if (!db) {
    dev.posts.set(id, { id, title, body, created_at: new Date().toISOString() });
    return;
  }
  await db.prepare(`INSERT INTO posts (id, title, body) VALUES (?, ?, ?)`)
    .bind(id, title, body).run();
}

export async function insertVideo(env: any, v: {
  id: string; s3_key: string; title?: string; description?: string; size_bytes?: number; content_type?: string;
}) {
  const db = await getDB(env);
  if (!db) {
    dev.videos.set(v.id, {
      id: v.id,
      s3_key: v.s3_key,
      title: v.title || null,
      description: v.description || null,
      size_bytes: v.size_bytes ?? null,
      content_type: v.content_type || null,
      created_at: new Date().toISOString()
    });
    return;
  }
  await db.prepare(
    `INSERT INTO videos (id, s3_key, title, description, size_bytes, content_type)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(v.id, v.s3_key, v.title || null, v.description || null, v.size_bytes || null, v.content_type || null).run();
}

export async function attachVideoToPost(env: any, post_id: string, video_id: string) {
  const db = await getDB(env);
  if (!db) {
    const set = dev.postVideos.get(post_id) ?? new Set<string>();
    set.add(video_id);
    dev.postVideos.set(post_id, set);
    return;
  }
  await db.prepare(`INSERT OR IGNORE INTO post_videos (post_id, video_id) VALUES (?, ?)`)
    .bind(post_id, video_id).run();
}

export async function getVideo(env: any, id: string) {
  const db = await getDB(env);
  if (!db) {
    const row = dev.videos.get(id);
    return row || null;
  }
  const r = await db.prepare(`SELECT * FROM videos WHERE id = ?`).bind(id).first();
  return r || null;
}
