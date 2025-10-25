import { listPosts } from "@/lib/db";
export const runtime = 'edge';


export default async function Page() {
// @ts-ignore Cloudflare adapter exposes env on process.env at runtime
const env = (globalThis as any).process?.env as any;
const posts = await listPosts(env);
return (
<main>
<h1>Timeline</h1>
<p>MP4/H.264 recommended. View/download links are time-limited.</p>
<ul style={{listStyle:'none', padding:0}}>
{posts.map((p: any) => (
<li key={p.id} style={{border:'1px solid #ddd', padding:12, margin:'12px 0', borderRadius:8}}>
<h3>{p.title}</h3>
<p>{p.body}</p>
<small>{new Date(p.created_at).toLocaleString()}</small>
<div style={{marginTop:8}}>
{(p.video_ids?.split(',')||[]).filter(Boolean).map((vid: string) => (
<div key={vid} style={{marginTop:8}}>
<a href={`/watch/${vid}`}>Watch {vid.slice(0,8)}…</a>
</div>
))}
</div>
</li>
))}
</ul>
</main>
);
}