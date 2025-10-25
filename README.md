# Predictable-Cost Video Site (Wasabi + Cloudflare Pages/Workers + D1)


## Setup
1. Create Wasabi bucket + access key.
2. Cloudflare → D1 → create `videos_db`, run `schema.sql`.
3. Cloudflare Pages → create project (Next.js preset).
4. Pages → Settings → Functions → D1 Bindings → add `VIDEOS_DB` → `videos_db`.
5. Pages → Settings → Env vars: set WASABI_* + MAX_FILE_BYTES + DAILY_UPLOAD_BYTES + DATABASE_ID=VIDEOS_DB.
6. Push code to `main`. Pages builds with `npm run build`.
7. Open site → `/upload` → test MP4 upload.


## Local
```bash
npm i
cp .env.local.example .env.local
npm run dev