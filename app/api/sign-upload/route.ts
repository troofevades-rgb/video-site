import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request, env: any, _ctx?: any) {
  try {
    const { filename, size_bytes } = await req.json();
    if (!filename || !size_bytes) {
      return NextResponse.json({ error: "Missing filename or size" }, { status: 400 });
    }

    const video_id = crypto.randomUUID();
    const key = `videos/${video_id}_${filename}`;

    const s3 = new S3Client({
      region: env.WASABI_REGION,
      endpoint: env.WASABI_ENDPOINT,
      credentials: { accessKeyId: env.WASABI_KEY, secretAccessKey: env.WASABI_SECRET },
      forcePathStyle: true,
    });

    const signedPutUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: env.WASABI_BUCKET, Key: key }),
      { expiresIn: 600 }
    );

    return NextResponse.json({ signedPutUrl, key, video_id });
  } catch (err: any) {
    console.error("sign-upload error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
