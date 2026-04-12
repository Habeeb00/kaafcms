import { db } from '@/db';
import { blogs, careers, galleries } from '@/db/schema';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PenTool, Briefcase, Image as ImageIcon, CircleDot } from 'lucide-react';

async function getStats() {
  const [blogCount, careerCount, galleryCount] = await Promise.all([
    db.select().from(blogs).all(),
    db.select().from(careers).all(),
    db.select().from(galleries).all(),
  ]);
  return {
    blogs: blogCount.length,
    careers: careerCount.length,
    gallery: galleryCount.length,
    openCareers: careerCount.filter(c => c.status === 'open').length,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const STATS = [
    { label: 'Blog Posts', value: stats.blogs, icon: <PenTool className="h-6 w-6 text-foreground/70" />, href: '/dashboard/blogs', color: 'text-foreground' },
    { label: 'Career Listings', value: stats.careers, icon: <Briefcase className="h-6 w-6 text-foreground/70" />, href: '/dashboard/careers', color: 'text-foreground' },
    { label: 'Gallery Items', value: stats.gallery, icon: <ImageIcon className="h-6 w-6 text-foreground/70" />, href: '/dashboard/gallery', color: 'text-foreground' },
    { label: 'Open Positions', value: stats.openCareers, icon: <CircleDot className="h-6 w-6 text-foreground/70" />, href: '/dashboard/careers', color: 'text-foreground' },
  ];

  const SECTIONS = [
    { href: '/dashboard/blogs',   label: 'Manage Blogs',   description: 'Create, edit & delete blog posts with a rich text editor', icon: <PenTool className="h-6 w-6" />, bgColor: 'bg-muted/10', borderColor: 'border-border' },
    { href: '/dashboard/careers', label: 'Manage Careers',  description: 'Post job openings and toggle listings open or closed',       icon: <Briefcase className="h-6 w-6" />, bgColor: 'bg-muted/10', borderColor: 'border-border' },
    { href: '/dashboard/gallery', label: 'Manage Gallery',  description: 'Upload and organise images for the gallery page',            icon: <ImageIcon className="h-6 w-6" />, bgColor: 'bg-muted/10', borderColor: 'border-border' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Overview</h1>
        <p className="text-muted-foreground">Welcome back — here's what's going on with your content.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map(s => (
          <Link key={s.label} href={s.href} className="transition-transform hover:-translate-y-1">
            <Card className="hover:border-primary transition-colors h-full">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
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

      {/* Quick links */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground/80">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(s => (
            <Link key={s.href} href={s.href}>
              <Card className="hover:border-primary transition-colors h-full flex flex-col cursor-pointer">
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${s.bgColor} border border-border/50`}>
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
