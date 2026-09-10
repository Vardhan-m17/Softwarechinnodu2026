import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell } from '../../../../components/Shell';
import { createClient } from '../../../../lib/supabase/server';
import JobLifecycleActions from './actions';

export default async function AdminJobDetails({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job) notFound();
  const status = job.status || 'active';
  const statusLabel = status.replace('_', ' ');
  return <Shell admin><div className="admin-pro-page job-details-page">
    <div className="job-details-breadcrumb"><Link href="/admin/jobs">Jobs</Link><span>›</span><span>Job Details</span></div>
    <header className="job-details-header"><div><small>JOB DETAILS</small><h1>{job.title}</h1><p>{job.company} · {job.location || 'Location not specified'} · {job.job_type || 'Full-time'}</p></div>
      <div className="job-details-actions"><span className="job-active-pill">{statusLabel}</span><Link href={`/admin/jobs/${job.id}/edit`}>Edit</Link><JobLifecycleActions jobId={job.id} status={status}/></div>
    </header>
    <nav className="job-details-tabs"><Link className="active" href={`/admin/jobs/${job.id}`}>Overview</Link><Link href={`/admin/jobs/${job.id}/applications`}>Applications</Link><Link href={`/admin/jobs/${job.id}/analytics`}>Analytics</Link><Link href={`/admin/jobs/${job.id}/activity`}>Activity</Link></nav>
    <div className="job-details-grid"><section className="admin-panel-pro"><small>JOB DESCRIPTION</small><h2>About this role</h2><p className="job-details-copy">{job.description || 'No job description has been added yet.'}</p><h3>Required skills</h3><div className="job-skill-list">{(job.skills || []).length ? (job.skills || []).map((skill: string) => <span key={skill}>{skill}</span>) : <small>No skills specified</small>}</div></section>
      <aside className="admin-panel-pro"><small>JOB DETAILS</small><dl><dt>Job Type</dt><dd>{job.job_type || 'Full-time'}</dd><dt>Experience</dt><dd>{job.experience_level || 'Not specified'}</dd><dt>Salary Range</dt><dd>{job.salary || 'Not disclosed'}</dd><dt>Location</dt><dd>{job.location || 'Not specified'}</dd><dt>Posted</dt><dd>{new Date(job.created_at).toLocaleDateString('en-IN')}</dd><dt>Status</dt><dd><span className="job-active-pill">{statusLabel}</span></dd></dl></aside>
    </div>
  </div></Shell>;
}
