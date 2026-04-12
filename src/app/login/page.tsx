'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kaaf.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Invalid credentials');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        {/* Logo Area */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-card border border-border mb-4 shadow-sm p-2">
            <Image src="/favicon.svg" alt="Kaaf Logistics" width={32} height={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Kaaf CMS</h1>
          <p className="text-muted-foreground text-sm">Sign in to manage your content</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-border/50">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@kaaf.com"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t bg-muted/20 px-6 py-4 mt-2">
            <div className="text-center text-sm text-muted-foreground">
              Default credentials: <br />
              <strong className="text-foreground">admin@kaaf.com</strong> / <strong className="text-foreground">password123</strong>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

