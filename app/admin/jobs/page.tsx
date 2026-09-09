import Link from 'next/link';
import { Shell } from '../../../components/Shell';
import { createClient } from '../../../lib/supabase/server';

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { count: applications }, { data: imports }] = await Promise.all([
    supabase.from('jobs').select('id,title,company,location,source,created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('instagram_job_imports').select('id,status').eq('status', 'pending'),
  ]);
  const rows = jobs ?? [];
  const sourceCount = new Set(rows.map(job => job.source || 'Manual')).size;
  return <Shell admin><div className="admin-pro-page jobs-operations-page">
    <header className="admin-hero"><div><span className="admin-eyebrow">JOB OPERATIONS</span><h1>Jobs</h1><p>Manage and monitor job postings, applications, and job scrapers.</p></div><div className="admin-hero-actions"><Link className="admin-secondary-action" href="/admin/instagram">Instagram imports {imports?.length ? `(${imports.length})` : ''}</Link><Link className="admin-primary-action" href="/jobs">Open public jobs</Link></div></header>
    <section className="job-kpi-grid"><div><span>▣</span><small>Total Jobs</small><strong>{rows.length.toLocaleString('en-IN')}</strong><em>Published records</em></div><div><span>◉</span><small>Active Jobs</small><strong>{rows.length.toLocaleString('en-IN')}</strong><em>Visible to users</em></div><div><span>▤</span><small>Applications</small><strong>{(applications ?? 0).toLocaleString('en-IN')}</strong><em>Tracked applications</em></div><div><span>◎</span><small>Job Scrapers</small><strong>{sourceCount}</strong><em>{imports?.length ?? 0} pending review</em></div></section>
    <nav className="jobs-admin-tabs"><Link className="active" href="/admin/jobs">All Jobs</Link><Link href="/admin/jobs?status=active">Active</Link><Link href="/admin/instagram">Pending Review</Link><Link href="/admin/jobs?status=paused">Paused</Link><Link href="/admin/jobs?status=expired">Expired</Link></nav>
    <div className="jobs-admin-toolbar"><input aria-label="Search jobs" placeholder="Search jobs by title, company, skills..."/><select defaultValue="all"><option value="all">All Locations</option></select><select defaultValue="all"><option value="all">All Job Types</option></select><select defaultValue="all"><option value="all">All Sources</option></select><button>⌕ Filters</button></div>
    <div className="admin-grid-pro admin-jobs-grid"><section className="admin-panel-pro"><div className="panel-heading"><div><small>PUBLISHED JOBS</small><h2>{rows.length ? `${rows.length} recent jobs` : 'No published jobs'}</h2></div><Link href="/admin/instagram" className="panel-link">Review imports →</Link></div>{rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Job Title</th><th>Company</th><th>Location</th><th>Type</th><th>Posted On</th><th>Status</th></tr></thead><tbody>{rows.map(job => <tr key={job.id}><td><Link href={`/jobs/${job.id}`}>{job.title}</Link><small className="admin-table-subtitle">{job.company}</small></td><td>{job.company}</td><td>{job.location || '—'}</td><td>Full-time</td><td>{new Date(job.created_at).toLocaleDateString('en-IN')}</td><td><span className="status-chip">Active</span></td></tr>)}</tbody></table></div> : <div className="admin-empty">No jobs have been published. Import a source to begin review.</div>}</section><section className="admin-panel-pro"><div className="panel-heading"><div><small>INGESTION PIPELINE</small><h2>Job Scraper Status</h2></div></div><div className="pipeline-list"><span>1. Scraped / imported</span><span>2. Extracted</span><span>3. Duplicate check</span><span>4. Admin review</span><span>5. Published</span></div><Link className="admin-primary-action" href="/admin/instagram">Manage scrapers →</Link></section></div>
  </div></Shell>;
}
