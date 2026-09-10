import { redirect } from 'next/navigation';
export default function SearchJobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return searchParams.then(params => redirect(`/admin/jobs?search=${encodeURIComponent(typeof params.search === 'string' ? params.search : '')}`)); }
