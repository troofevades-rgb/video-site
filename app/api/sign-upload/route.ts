import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const runtime = "edge";

/** Read Wasabi config from Cloudflare-injected `env` (or process.env when local). */
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
    throw new Error(
      "Missing Wasabi env. Set WASABI_REGION, WASABI_ENDPOINT, WASABI_BUCKET, WASABI_KEY, WASABI_SECRET."
    );
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

export async function POST(req: Request, env: any) {
  try {
    const { filename, size_bytes } = await req.json();
    if (!filename || !size_bytes) {
      return NextResponse.json({ error: "Missing filename or size" }, { status: 400 });
    }

    const E = getEnv(env);

    const video_id = crypto.randomUUID(); // Web Crypto (Edge-safe)
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_"); // avoid odd chars in key
    const key = `videos/${video_id}_${safeName}`;

    const s3 = makeS3(E);

    // Important: no ContentType/ACL/extra headers in the command (keeps signature simple).
    const signedPutUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: E.WASABI_BUCKET, Key: key }),
      { expiresIn: 600 }
    );

    return NextResponse.json({ signedPutUrl, key, video_id });
  } catch (err: any) {
    console.error("sign-upload error:", err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
