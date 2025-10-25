// lib/devStore.ts
export type VideoRow = {
  id: string;
  s3_key: string;
  title?: string | null;
  description?: string | null;
  size_bytes?: number | null;
  content_type?: string | null;
  created_at?: string;
};

export type PostRow = {
  id: string;
  title: string;
  body?: string | null;
  created_at?: string;
};

export const dev = {
  videos: new Map<string, VideoRow>(),
  posts: new Map<string, PostRow>(),
  postVideos: new Map<string, Set<string>>() // post_id -> set of video_ids
};