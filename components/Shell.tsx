'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogoutButton } from './LogoutButton';
import { NotificationButton } from './NotificationButton';
import { MessageButton } from './MessageButton';
import { AccountMenu } from './AccountMenu';

const userNav = [['Dashboard', '/dashboard'], ['Jobs', '/jobs'], ['Voice Talk Zone', '/voice-talk-zone'], ['Resume Builder', '/resume-builder'], ['Mock Tests', '/mock-tests'], ['AI Tools', '/ai-tools'], ['Learning', '/learning'], ['Applications', '/applications'], ['Saved Jobs', '/saved-jobs'], ['Career Insights', '/career-insights'], ['Settings', '/settings']];
const adminNav = [['⌂', 'Dashboard', '/admin/dashboard'], ['♙', 'Users', '/admin/users'], ['▣', 'Jobs & Scrapers', '/admin/jobs'], ['•', 'Jobs', '/admin/jobs'], ['•', 'Scrapers', '/admin/instagram'], ['•', 'Applications', '/admin/applications'], ['✦', 'AI Services', '/admin/ai-services'], ['▧', 'Resume Builder', '/resume-builder'], ['✓', 'Mock Tests', '/mock-tests'], ['◇', 'Learning Content', '/learning'], ['♧', 'Voice Talk Zone', '/voice-talk-zone'], ['✧', 'AI Tools', '/ai-tools'], ['▥', 'Analytics', '/admin/analytics'], ['⌁', 'System Health', '/admin/health'], ['⚙', 'Settings', '/settings']];
const publicNav = [['Home', '/homepage'], ...userNav.slice(1)];

export function Shell({ children, admin = false, publicMode = false }: { children: React.ReactNode; admin?: boolean; publicMode?: boolean }) {
  const pathname = usePathname();
  const [jobsOpen, setJobsOpen] = useState(pathname.startsWith('/admin/jobs') || pathname.startsWith('/admin/instagram'));
  const items = publicMode ? publicNav : admin ? adminNav : userNav;
  return <div className={`shell ${publicMode ? 'public-shell' : ''} ${admin ? 'admin-shell' : ''}`}><aside className="side"><Link href={publicMode ? '/homepage' : admin ? '/admin/dashboard' : '/dashboard'} className="brand"><img className="brand-mark" src="/softwarechinnodu-mark.png" alt="SoftwareChinnodu logo"/><strong>SoftwareChinnodu</strong><small>{admin ? 'Admin Panel' : 'AI Career Partner'}</small></Link><nav className="nav">{items.map((item, index) => { const [icon, label, href] = admin ? item : ['•', item[0], item[1]]; const sub = admin && ['Jobs', 'Scrapers', 'Applications'].includes(label); const active = pathname === href || (label === 'Jobs & Scrapers' && pathname.startsWith('/admin/jobs')); if (sub && !jobsOpen) return null; if (label === 'Jobs & Scrapers') return <button key={`${href}-${index}`} type="button" onClick={() => setJobsOpen(open => !open)} className={`${active ? 'active' : ''} nav-group nav-dropdown-button`}><span>{icon}</span>{label}<b>{jobsOpen ? '⌃' : '⌄'}</b></button>; return <Link key={`${href}-${index}`} href={href} className={`${active ? 'active' : ''} ${sub ? 'nav-subitem' : ''}`}><span>{icon}</span>{label}</Link>; })}</nav>{!admin && <div className="side-bottom">Upgrade to Premium<br/><span>Unlock advanced AI tools, unlimited mock tests, priority support &amp; more.</span>{publicMode ? <Link className="button button-block" href="/register">Register Now</Link> : <LogoutButton />}</div>}</aside><main className="main"><header className="top"><span className="mobile-menu">☰</span><div className="search">Search users, jobs, applications, logs... <span style={{ marginLeft: 'auto' }}>⌕</span></div><div className="top-right">{publicMode ? <><Link className="login-link" href="/login">Login</Link><Link className="login-link public-register" href="/register">Register</Link></> : <><NotificationButton /><MessageButton /><AccountMenu /></>}</div></header>{children}</main></div>;
}
