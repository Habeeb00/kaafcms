'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Menu, X, LogOut, LayoutDashboard, PenTool, Briefcase, Image as ImageIcon, Zap, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { href: '/dashboard',         label: 'Overview',  icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/dashboard/blogs',   label: 'Blogs',     icon: <PenTool className="h-4 w-4" /> },
  { href: '/dashboard/careers', label: 'Careers',   icon: <Briefcase className="h-4 w-4" /> },
  { href: '/dashboard/gallery', label: 'Gallery',   icon: <ImageIcon className="h-4 w-4" /> },
  { href: '/dashboard/test',    label: 'Test Sync', icon: <Zap className="h-4 w-4" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden relative bg-background">
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 z-30">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <div className="font-bold">Kaaf CMS</div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={closeSidebar}
          className="absolute inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 flex-shrink-0 bg-card border-r border-border flex flex-col p-4 transition-transform duration-300 z-40",
        "absolute md:relative inset-y-0 left-0 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Brand */}
        <div className="flex items-center justify-between pb-6 pt-2 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center p-1.5 shadow-sm flex-shrink-0">
              <Image src="/favicon.svg" alt="Kaaf Logistics" width={24} height={24} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-foreground">Kaaf CMS</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Admin Panel</div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1">
          {NAV.map(({ href, label, icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Button
                key={href}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "justify-start w-full text-left gap-3 h-10",
                  active && "bg-secondary text-foreground font-semibold border-none"
                )}
                asChild
                onClick={closeSidebar}
              >
                <Link href={href}>
                  <span className="w-5 flex justify-center text-muted-foreground group-hover:text-foreground">{icon}</span>
                  {label}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t border-border mt-auto">
          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/20 pb-20 md:pb-8 pt-20 md:pt-8 w-full">
        {children}
      </main>
    </div>
  );
}

