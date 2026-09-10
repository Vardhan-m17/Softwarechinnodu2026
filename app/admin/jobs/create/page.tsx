import Link from 'next/link';
import { Shell } from '../../../../components/Shell';
import JobCreateForm from './form';

export default function CreateJobPage() { return <Shell admin><div className="admin-pro-page job-create-page"><header className="admin-hero"><div><span className="admin-eyebrow">JOBS MANAGEMENT</span><h1>Post a New Job</h1><p>Fill in the details below to publish a new job opening.</p></div><Link className="admin-secondary-action" href="/admin/jobs">Cancel</Link></header><JobCreateForm /></div></Shell>; }
