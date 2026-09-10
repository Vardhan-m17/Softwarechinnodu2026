import { redirect } from 'next/navigation';
export default function ActiveJobsPage() { redirect('/admin/jobs?status=active'); }
