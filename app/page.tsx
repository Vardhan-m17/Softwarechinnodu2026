import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';

export default async function Home() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect('/homepage');
  const { data: profile } = await (await createClient()).from('profiles').select('role').eq('id', user.id).maybeSingle();
  redirect(profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
}
