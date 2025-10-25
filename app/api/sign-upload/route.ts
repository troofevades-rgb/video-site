import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const runtime = "edge"; // important for Cloudflare

export async function POST(req: Request, env: Env) {
  try {
    const { filename, size_bytes, post } = await req.json();

    // safety check
    if (!filename || !size_bytes) {
      return NextResponse.json({ error: "Missing filename or size" }, { status: 400 });
    }

    // generate unique key path for video
    const video_id = crypto.randomUUID();
    const key = `videos/${video_id}_${filename}`;

    // set up Wasabi S3 client
    const s3 = new S3Client({
      region: env.WASABI_REGION,
      endpoint: env.WASABI_ENDPOINT,
      credentials: {
        accessKeyId: env.WASABI_KEY,
        secretAccessKey: env.WASABI_SECRET,
      },
      forcePathStyle: true, // critical for Wasabi
    });

    // presign the PUT URL (no ContentType or extra headers)
    const signedPutUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: env.WASABI_BUCKET,
        Key: key,
      }),
      { expiresIn: 600 }
    );

    // respond to the browser with the presigned URL + IDs
    return NextResponse.json({ signedPutUrl, key, video_id });
  } catch (err: any) {
    console.error("sign-upload error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
