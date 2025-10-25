import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getVideo } from '@/lib/db';


export const runtime = 'edge';


export async function POST(req: NextRequest) {
const env: any = (process as any).env;
const { id } = await req.json();
const row = await getVideo(env, id);
if(!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });


const s3 = new S3Client({
region: env.WASABI_REGION,
endpoint: env.WASABI_ENDPOINT,
credentials: { accessKeyId: env.WASABI_KEY, secretAccessKey: env.WASABI_SECRET },
forcePathStyle: true,
});


const viewUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: env.WASABI_BUCKET, Key: row.s3_key }), { expiresIn: 60 * 60 });
const downloadUrl = viewUrl;


return NextResponse.json({ viewUrl, downloadUrl });
}
