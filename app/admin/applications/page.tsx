import { Shell } from '../../../components/Shell';
import { createClient } from '../../../lib/supabase/server';

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const { data: applicationsData } = await supabase.from('applications').select('id, applicant_name, applicant_email, status, created_at').order('created_at', { ascending: false }).limit(50);
  const applications = applicationsData ?? [];
  return <Shell admin><div className="admin-pro-page"><header className="admin-hero"><div><span className="admin-eyebrow">WORKFLOW</span><h1>Applications</h1><p>Monitor application records stored in Supabase.</p></div></header><section className="admin-panel-pro admin-table-panel"><div className="panel-heading"><div><small>REAL APPLICATION RECORDS</small><h2>{applications.length ? `${applications.length} recent applications` : 'No applications yet'}</h2></div></div>{applications.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Applicant</th><th>Email</th><th>Status</th><th>Created</th></tr></thead><tbody>{applications.map(application => <tr key={application.id}><td>{application.applicant_name || 'Registered user'}</td><td>{application.applicant_email || '—'}</td><td><span className="status-chip">{application.status}</span></td><td>{new Date(application.created_at).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No applications are available.</div>}</section></div></Shell>;
}
