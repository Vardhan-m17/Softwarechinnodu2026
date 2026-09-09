import { Shell } from '../../../components/Shell';
import { createClient } from '../../../lib/supabase/server';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: usersData } = await supabase.from('profiles').select('id, full_name, headline, role, created_at, updated_at').order('created_at', { ascending: false }).limit(50);
  const users = usersData ?? [];
  return <Shell admin><div className="admin-pro-page"><header className="admin-hero"><div><span className="admin-eyebrow">ADMINISTRATION</span><h1>Users</h1><p>Review registered profiles and account activity.</p></div></header><section className="admin-panel-pro admin-table-panel"><div className="panel-heading"><div><small>REAL DATABASE RECORDS</small><h2>{users.length ? `${users.length} recent profiles` : 'No users yet'}</h2></div></div>{users.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Headline</th><th>Role</th><th>Joined</th><th>Last updated</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td>{user.full_name || 'Unnamed user'}</td><td>{user.headline || '—'}</td><td><span className="status-chip">{user.role}</span></td><td>{new Date(user.created_at).toLocaleDateString('en-IN')}</td><td>{new Date(user.updated_at).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No registered profiles are available.</div>}</section></div></Shell>;
}
