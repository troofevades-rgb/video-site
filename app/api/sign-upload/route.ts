import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { insertPost, insertVideo, attachVideoToPost } from '@/lib/db';


export const runtime = 'edge';


export async function POST(req: NextRequest) {
const env: any = (process as any).env;
const { filename, size_bytes, contentType, post } = await req.json();


const max = Number(env.MAX_FILE_BYTES || 2147483648);
if(size_bytes > max) return NextResponse.json({ error: 'File too large' }, { status: 400 });


const s3 = new S3Client({
  region: env.WASABI_REGION,
  endpoint: env.WASABI_ENDPOINT,
  credentials: { accessKeyId: env.WASABI_KEY, secretAccessKey: env.WASABI_SECRET },
  forcePathStyle: true,               // <-- important
});



const video_id = uuid();
const key = `videos/${video_id}_${filename}`;


if(post?.id && post?.title){
await insertPost(env, post.id, post.title, post.body || '');
}


await insertVideo(env, { id: video_id, s3_key: key, size_bytes, content_type: contentType || 'video/mp4' });
if(post?.id) await attachVideoToPost(env, post.id, video_id);


const put = await getSignedUrl(
s3,
new PutObjectCommand({ Bucket: env.WASABI_BUCKET, Key: key, ContentType: contentType || 'video/mp4' }),
{ expiresIn: 60 * 10 }
);


return NextResponse.json({ signedPutUrl: put, key, video_id });
}
