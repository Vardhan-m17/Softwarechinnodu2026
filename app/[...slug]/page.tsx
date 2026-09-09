import Link from 'next/link';

export default async function Placeholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const admin = slug[0] === 'secure-admin';
  const title = slug.at(-1)?.replaceAll('-', ' ') || 'jobs';

  return (
    <main className="public-page">
      {!admin && <header className="public-header"><Link href="/" className="public-brand">SoftwareChinnodu</Link><nav><Link href="/jobs">Find Jobs</Link><Link href="/login" className="public-login">Log in</Link><Link href="/signup" className="public-signup">Register</Link></nav></header>}
      <section className="public-card">
        <span className="public-kicker">SoftwareChinnodu · Career Platform</span>
        <h1>{title}</h1>
        <p>{admin ? 'Secure administration module.' : 'Explore opportunities, build your profile, and move your career forward.'}</p>
        {!admin && <div className="public-actions"><Link href="/login" className="button">Log in</Link><Link href="/signup" className="button public-outline">Create account</Link></div>}
      </section>
    </main>
  );
}
