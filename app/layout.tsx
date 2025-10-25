export const metadata = { title: "Video Timeline" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en"><body style={{fontFamily:'system-ui', margin:20}}>
<header style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
<a href="/" style={{fontWeight:700}}>Home</a>
<a href="/upload">Upload</a>
</header>
{children}
</body></html>
);
}