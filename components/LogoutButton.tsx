'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  async function logout() { const { error } = await createClient().auth.signOut(); if (!error) { router.replace('/homepage'); router.refresh(); } }
  return <button type="button" className="login-link logout-button" onClick={logout}>Log out</button>;
}
