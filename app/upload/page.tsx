'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [status, setStatus] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Quick runtime sanity checks to show on the page
  const checks = typeof window !== 'undefined'
    ? 'client ok'
    : 'NO WINDOW';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setStatus('Pick a file first'); return; }
    setStatus('Requesting upload URL…');

    try {
      const r = await fetch('/api/sign-upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          size_bytes: file.size,
          contentType: file.type || 'video/mp4',
          post: { id: crypto.randomUUID(), title, body }
        })
      });
      if (!r.ok) {
        const txt = await r.text().catch(()=>'');
        setStatus(`Sign failed (${r.status}) ${txt}`);
        return;
      }
      const { signedPutUrl, video_id } = await r.json();
      setStatus('Uploading…');
      const put = await fetch(signedPutUrl, { method: 'PUT', body: file });
      // (no extra headers)
      
      if (!put.ok) {
        const txt = await put.text().catch(()=>'');
        setStatus(`Upload failed (${put.status}) ${txt}`);
        return;
      }
      setStatus('Uploaded! Redirecting…');
      window.location.href = `/watch/${video_id}`;
    } catch (err: any) {
      setStatus(`Error: ${err?.message || String(err)}`);
    }
  }

  return (
    <main style={{maxWidth: 720}}>
      <h1>Upload a video</h1>
      <p><small>Diagnostics: {checks}</small></p>
      <form onSubmit={onSubmit}>
        <div style={{margin:'8px 0'}}>
          <label>Title<br/>
            <input value={title} onChange={e=>setTitle(e.target.value)} required />
          </label>
        </div>
        <div style={{margin:'8px 0'}}>
          <label>Post text<br/>
            <textarea value={body} onChange={e=>setBody(e.target.value)} />
          </label>
        </div>
        <div style={{margin:'8px 0'}}>
          <label>Video file<br/>
            <input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0] || null)} required />
          </label>
          <div><small>Max size (env): {Number(process.env.MAX_FILE_BYTES||0) ? Math.round(Number(process.env.MAX_FILE_BYTES)/(1024*1024))+' MB' : 'not set'}</small></div>
        </div>
        <button type="submit">Upload</button>
      </form>
      <p>{status}</p>
    </main>
  );
}
