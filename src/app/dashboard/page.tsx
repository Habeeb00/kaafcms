import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PenTool, Briefcase, Image as ImageIcon, CircleDot } from 'lucide-react';
import { getDashboardStats, isDatabaseOfflineError } from '@/lib/remote-db';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let stats = {
    blogs: 0,
    careers: 0,
    gallery: 0,
    openCareers: 0,
  };
  let offline = false;

  try {
    stats = await getDashboardStats();
  } catch (error) {
    if (isDatabaseOfflineError(error)) {
      offline = true;
    } else {
      throw error;
    }
  }

  const STATS = [
    { label: 'Blog Posts', value: stats.blogs, icon: <PenTool className="h-6 w-6 text-foreground/70" />, href: '/dashboard/blogs', color: 'text-foreground' },
    { label: 'Career Listings', value: stats.careers, icon: <Briefcase className="h-6 w-6 text-foreground/70" />, href: '/dashboard/careers', color: 'text-foreground' },
    { label: 'Gallery Items', value: stats.gallery, icon: <ImageIcon className="h-6 w-6 text-foreground/70" />, href: '/dashboard/gallery', color: 'text-foreground' },
    { label: 'Open Positions', value: stats.openCareers, icon: <CircleDot className="h-6 w-6 text-foreground/70" />, href: '/dashboard/careers', color: 'text-foreground' },
  ];

  const SECTIONS = [
    { href: '/dashboard/blogs', label: 'Manage Blogs', description: 'Create, edit & delete blog posts with a rich text editor', icon: <PenTool className="h-6 w-6" />, bgColor: 'bg-muted/10' },
    { href: '/dashboard/careers', label: 'Manage Careers', description: 'Post job openings and toggle listings open or closed', icon: <Briefcase className="h-6 w-6" />, bgColor: 'bg-muted/10' },
    { href: '/dashboard/gallery', label: 'Manage Gallery', description: 'Upload and organise images for the gallery page', icon: <ImageIcon className="h-6 w-6" />, bgColor: 'bg-muted/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Overview</h1>
        <p className="text-muted-foreground">
          {offline
            ? 'Database offline. Connect to Cloudflare D1 to view CMS content.'
            : "Welcome back. Here's what's going on with your content."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className="transition-transform hover:-translate-y-1">
            <Card className="h-full transition-colors hover:border-primary">
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="mb-4 flex items-start justify-between">
                  <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
                  <div className="text-2xl">{s.icon}</div>
                </div>
                <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground/80">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="flex h-full cursor-pointer flex-col transition-colors hover:border-primary">
                <CardHeader className="pb-2">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 text-2xl ${s.bgColor}`}>
                    {s.icon}
                  </div>
                  <CardTitle className="text-lg">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {s.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
