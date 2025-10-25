import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const runtime = "edge";

function makeS3(env: any) {
  return new S3Client({
    region: env.WASABI_REGION,
    endpoint: env.WASABI_ENDPOINT,
    credentials: { accessKeyId: env.WASABI_KEY, secretAccessKey: env.WASABI_SECRET },
    forcePathStyle: true,
  });
}

async function keyFromId(env: any, id: string): Promise<string | null> {
  try {
    const db = (env as any)?.VIDEOS_DB;
    if (!db || typeof db.prepare !== "function") return null;
    const row = await db.prepare("SELECT s3_key FROM videos WHERE id = ?").bind(id).first();
    return row?.s3_key ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request, env: any, _ctx?: any) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const id  = url.searchParams.get("id");

    let objectKey = key || "";
    if (!objectKey && id) {
      const looked = await keyFromId(env, id);
      if (!looked) return NextResponse.json({ error: "Video not found" }, { status: 404 });
      objectKey = looked;
    }
    if (!objectKey) {
      return NextResponse.json({ error: "Missing 'key' or 'id' query param" }, { status: 400 });
    }

    const s3 = makeS3(env);
    const signedGetUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: env.WASABI_BUCKET, Key: objectKey }),
      { expiresIn: 600 }
    );

    return NextResponse.json({ signedGetUrl, key: objectKey });
  } catch (err: any) {
    console.error("sign-get error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
