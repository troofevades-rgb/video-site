import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const runtime = "edge";

function getEnv(maybeEnv: any) {
  const pe = (process as any)?.env ?? {};
  const read = (k: string) => (maybeEnv && k in maybeEnv ? maybeEnv[k] : pe[k]);
  const out = {
    WASABI_REGION: read("WASABI_REGION"),
    WASABI_ENDPOINT: read("WASABI_ENDPOINT"),
    WASABI_BUCKET: read("WASABI_BUCKET"),
    WASABI_KEY: read("WASABI_KEY"),
    WASABI_SECRET: read("WASABI_SECRET"),
  };
  if (!out.WASABI_REGION || !out.WASABI_ENDPOINT || !out.WASABI_BUCKET || !out.WASABI_KEY || !out.WASABI_SECRET) {
    throw new Error("Missing Wasabi env. Set WASABI_REGION/ENDPOINT/BUCKET/KEY/SECRET.");
  }
  return out;
}

function makeS3(E: ReturnType<typeof getEnv>) {
  return new S3Client({
    region: E.WASABI_REGION,
    endpoint: E.WASABI_ENDPOINT,
    credentials: { accessKeyId: E.WASABI_KEY, secretAccessKey: E.WASABI_SECRET },
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

export async function GET(req: Request, env: any) {
  try {
    const E = getEnv(env);
    const url = new URL(req.url);
    const keyQ = url.searchParams.get("key");
    const idQ = url.searchParams.get("id");

    let objectKey = keyQ || "";
    if (!objectKey && idQ) {
      const looked = await keyFromId(env, idQ);
      if (!looked) return NextResponse.json({ error: "Video not found" }, { status: 404 });
      objectKey = looked;
    }
    if (!objectKey) {
      return NextResponse.json({ error: "Missing 'key' or 'id' query param" }, { status: 400 });
    }

    const s3 = makeS3(E);
    const signedGetUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: E.WASABI_BUCKET, Key: objectKey }),
      { expiresIn: 600 }
    );

    return NextResponse.json({ signedGetUrl, key: objectKey });
  } catch (err: any) {
    console.error("sign-get error:", err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
