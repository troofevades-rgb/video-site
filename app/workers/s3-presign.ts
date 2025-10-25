import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


export default {
async fetch(req: Request, env: any) {
const url = new URL(req.url);
const s3 = new S3Client({
region: env.WASABI_REGION,
endpoint: env.WASABI_ENDPOINT,
credentials: { accessKeyId: env.WASABI_KEY, secretAccessKey: env.WASABI_SECRET }
});


if (req.method === 'POST' && url.pathname === '/sign-upload') {
const { filename, size_bytes, contentType } = await req.json();
const key = `videos/${crypto.randomUUID()}_${filename}`;
const signedPutUrl = await getSignedUrl(s3, new PutObjectCommand({
Bucket: env.WASABI_BUCKET,
Key: key,
ContentType: contentType || 'video/mp4'
}), { expiresIn: 600 });
return new Response(JSON.stringify({ key, signedPutUrl }), { headers: { 'content-type': 'application/json' } });
}


if (req.method === 'POST' && url.pathname === '/sign-get') {
const { key } = await req.json();
const signedGetUrl = await getSignedUrl(s3, new GetObjectCommand({
Bucket: env.WASABI_BUCKET,
Key: key
}), { expiresIn: 3600 });
return new Response(JSON.stringify({ url: signedGetUrl }), { headers: { 'content-type': 'application/json' } });
}


return new Response('Not found', { status: 404 });
}
}