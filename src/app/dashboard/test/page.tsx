'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud, RefreshCw, CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';

export default function ConnectionTestPage() {
  const [dbStatus, setDbStatus] = useState<'testing' | 'ok' | 'fail'>('testing');
  const [uploadStatus, setUploadStatus] = useState<string>('Ready');
  const [testUrl, setTestUrl] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string>('Waiting for data entry...');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Check DB Connectivity on Load
  useEffect(() => {
    async function checkDB() {
      try {
        const res = await fetch('/api/test/db');
        const data = await res.json();
        if (data.ok) setDbStatus('ok');
        else setDbStatus('fail');
      } catch (e) {
        setDbStatus('fail');
      }
    }
    checkDB();
  }, []);

  // 2. Test R2 Upload
  async function testUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading to Cloudflare R2...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setTestUrl(data.url);
        setUploadStatus('Success!');
      } else {
        setUploadStatus('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      setUploadStatus('Upload request failed.');
    } finally {
      setIsUploading(false);
    }
  }

  // 3. Create Test Sync Record
  async function createSyncRecord() {
    setIsSyncing(true);
    setSyncStatus('Creating record in D1...');
    try {
      const res = await fetch('/api/test/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncStatus('Record "TEST_SYNC" created! Now check the website frontend.');
      } else {
        setSyncStatus('Failed to create record.');
      }
    } catch (e) {
      setSyncStatus('Network error.');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" /> Connection Diagnostics
        </h1>
        <p className="text-muted-foreground">
          Use this page to verify that D1 and R2 are talking to your cloud account locally.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* D1 DATABASE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" /> Cloudflare D1
            </CardTitle>
            <CardDescription>
              Verifies if the SQL driver can perform a handshake with the remote database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              {dbStatus === 'testing' && <Loader2 className="h-5 w-5 animate-spin text-amber-500" />}
              {dbStatus === 'ok' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {dbStatus === 'fail' && <XCircle className="h-5 w-5 text-destructive" />}
              <span className="font-medium">
                {dbStatus === 'ok' ? 'Connected to Cloudflare D1' : dbStatus === 'fail' ? 'Connection Failed' : 'Checking connection...'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* FRONTEND SYNC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-cyan-500" /> Frontend Sync
            </CardTitle>
            <CardDescription>
              Create a temporary record to see if the main website picks it up instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createSyncRecord} disabled={isSyncing} className="w-full">
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Test Data
            </Button>
            <div className="text-sm p-3 bg-muted/30 rounded-lg border font-mono">
              {syncStatus}
            </div>
          </CardContent>
        </Card>

        {/* R2 STORAGE */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-amber-500" /> Cloudflare R2
            </CardTitle>
            <CardDescription>
              Upload any small image to test R2 routing and public bucket access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md">
              <Input type="file" onChange={testUpload} disabled={isUploading} className="cursor-pointer" />
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={uploadStatus.includes('Success') ? 'default' : uploadStatus.includes('Failed') ? 'destructive' : 'secondary'} className={uploadStatus.includes('Success') ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' : ''}>
                Status
              </Badge>
              <span className="text-sm font-medium">{uploadStatus}</span>
            </div>

            {testUrl && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border space-y-2">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Public R2 URL:</div>
                <a href={testUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm break-all font-mono">
                  {testUrl}
                </a>
                <div className="mt-2 text-xs text-muted-foreground">
                  Click the link above. If R2 is properly configured, you should see your image!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
