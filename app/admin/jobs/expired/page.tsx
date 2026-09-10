import { redirect } from 'next/navigation';
export default function ExpiredJobsPage() { redirect('/admin/jobs?status=expired'); }
