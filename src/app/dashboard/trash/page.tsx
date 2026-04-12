'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, RotateCcw, Ghost, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface TrashedItem {
  id: string;
  type: 'blog' | 'gallery';
  title: string;
  createdAt: string;
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/trash');
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrash(); }, [loadTrash]);

  async function handleAction(id: string, type: 'blog' | 'gallery', action: 'restore' | 'delete') {
    setActionLoading(id);
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, action })
      });
      if (res.ok) loadTrash();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEmptyTrash() {
    setActionLoading('empty');
    try {
      const res = await fetch('/api/trash', { method: 'DELETE' });
      if (res.ok) {
        setItems([]);
        setEmptyTrashConfirm(false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 font-serif">Trash Bin</h1>
          <p className="text-muted-foreground">Manage deleted items before permanent removal.</p>
        </div>
        {items.length > 0 && (
          <Button variant="destructive" onClick={() => setEmptyTrashConfirm(true)} disabled={loading || actionLoading === 'empty'}>
            <Trash2 className="mr-2 h-4 w-4" /> Empty Trash
          </Button>
        )}
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground h-64">
              <div className="mb-4 opacity-50">
                <Ghost className="w-16 h-16" />
              </div>
              <p className="text-lg font-medium">Your trash is empty.</p>
              <p className="text-sm">Items you delete from the CMS will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title / Info</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Original Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id + item.type}>
                    <TableCell className="font-medium max-w-[300px] truncate" title={item.title}>
                      {item.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'blog' ? 'default' : 'outline'} className="capitalize">
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAction(item.id, item.type, 'restore')}
                          disabled={!!actionLoading}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="px-2"
                          onClick={() => handleAction(item.id, item.type, 'delete')}
                          disabled={!!actionLoading}
                          title="Delete Forever"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Empty Trash Confirmation */}
      <Dialog open={emptyTrashConfirm} onOpenChange={setEmptyTrashConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Empty Trash?
            </DialogTitle>
            <DialogDescription>
              This action **cannot be undone**. All items in the trash and their associated images will be permanently deleted from Cloudflare R2.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setEmptyTrashConfirm(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleEmptyTrash} disabled={actionLoading === 'empty'}>
              {actionLoading === 'empty' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
