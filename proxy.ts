import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll: cookies => cookies.forEach(({ name, value, options }) => { request.cookies.set(name, value); response = NextResponse.next({ request }); response.cookies.set(name, value, options); }) } });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isRoot = pathname === '/';
  const isPublicEntry = pathname === '/homepage' || pathname === '/login' || pathname === '/register' || pathname === '/signup';
  const isAdminRoute = pathname.startsWith('/secure-admin') || pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const protectedRoutes = ['/my-applications', '/applications', '/saved-jobs', '/profile', '/career-insights'];
  const isProtectedRoute = isAdminRoute || isDashboardRoute || protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path));
  if (!user && isProtectedRoute) return NextResponse.redirect(new URL('/login', request.url));
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const destination = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    if (isRoot || isPublicEntry) return NextResponse.redirect(new URL(destination, request.url));
    if (isAdminRoute && profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url));
    if (isDashboardRoute && profile?.role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/',
    '/homepage',
    '/login',
    '/register',
    '/signup',
    '/secure-admin/:path*',
    '/admin/:path*',
    '/my-applications/:path*',
    '/applications/:path*',
    '/saved-jobs/:path*',
    '/profile/:path*',
    '/career-insights/:path*',
    '/settings/:path*',
    '/messages/:path*',
  ],
};
