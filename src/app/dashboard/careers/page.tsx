'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit2, Trash2, Briefcase } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface Career {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  location: string | null;
  type: string | null;
  workMode: string | null;
  link: string | null;
  createdAt: string;
}

const BLANK: Omit<Career, 'id' | 'createdAt'> = { 
  title: '', 
  description: '', 
  status: 'open', 
  location: '', 
  type: 'Full-time', 
  workMode: 'On-site', 
  link: '' 
};

const STATUSES = ['open', 'closed'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];
const LOCATIONS = [
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Riyadh, Saudi Arabia', 
  'Jeddah, Saudi Arabia', 'Dammam, Saudi Arabia', 'Muscat, Oman', 
  'Doha, Qatar', 'Kuwait City, Kuwait', 'Remote'
];

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadCareers = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/careers');
    const data = await r.json();
    setCareers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCareers(); }, [loadCareers]);

  function openCreate() { setForm(BLANK); setEditId(null); setError(''); setModal('create'); }
  function openEdit(c: Career) {
    setForm({ ...c }); setEditId(c.id); setError(''); setModal('edit');
  }
  function closeModal() { setModal(null); setEditId(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const url = modal === 'edit' ? `/api/careers/${editId}` : '/api/careers';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return; }
      closeModal(); loadCareers();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/careers/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadCareers();
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Careers</h1>
          <p className="text-muted-foreground">{careers.length} position{careers.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={openCreate} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Position
        </Button>
      </div>

      <Card className="flex-1">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : careers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
              <div className="mb-4 opacity-50">
                <Briefcase className="w-16 h-16" />
              </div>
              <p>No open positions yet. Start hiring!</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Work Mode</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {careers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium max-w-[260px] truncate" title={c.title}>
                          {c.title}
                        </TableCell>
                        <TableCell>
                          {c.workMode || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {c.type || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {c.status === 'open' ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 px-2 border capitalize">Open</Badge>
                          ) : c.status === 'closed' ? (
                            <Badge variant="secondary" className="px-2 capitalize">Closed</Badge>
                          ) : (
                            <Badge variant="outline" className="px-2 capitalize">{c.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                              <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(c.id)} className="px-2">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden flex flex-col gap-4 p-4">
                {careers.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-semibold">{c.title}</div>
                        {c.status === 'open' ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 border shrink-0">Open</Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">Closed</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                        {c.workMode && <span>{c.workMode}</span>}
                        {c.workMode && c.type && <span>•</span>}
                        {c.type && <span>{c.type}</span>}
                      </div>
                      <div className="flex gap-2 pt-3 border-t mt-1">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(c)}>
                          <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => setDeleteConfirm(c.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Main Modal using shadcn Dialog */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal === 'edit' ? 'Edit Position' : 'New Career Position'}</DialogTitle>
            <DialogDescription>
              {modal === 'edit' ? 'Make changes to the job posting.' : 'Fill out the details for the new job posting.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Senior Operations Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">External Link / Reference URL</Label>
                <Input id="link" value={form.link || ''} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={STATUSES.includes(form.status) ? form.status : 'Custom'} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val !== 'Custom') setForm(f => ({ ...f, status: val as any }));
                    else setForm(f => ({ ...f, status: 'Custom Status' as any }));
                  }}
                >
                  <option value="open">Open (Accepting Applications)</option>
                  <option value="closed">Closed (Not Accepting)</option>
                  <option value="Custom">Custom...</option>
                </select>
                {!STATUSES.includes(form.status) && (
                  <Input 
                    className="mt-2" 
                    value={form.status} 
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} 
                    placeholder="Enter custom status" 
                    autoFocus
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Employment Type</Label>
                <select 
                  id="type"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={(JOB_TYPES.includes(form.type || '') || form.type === '') ? (form.type || '') : 'Custom'} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val !== 'Custom') setForm(f => ({ ...f, type: val }));
                    else setForm(f => ({ ...f, type: 'Other' }));
                  }}
                >
                  <option value="">Select Employment Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Custom">Custom...</option>
                </select>
                {form.type !== '' && !JOB_TYPES.includes(form.type || '') && (
                  <Input 
                    className="mt-2" 
                    value={form.type || ''} 
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))} 
                    placeholder="Enter custom type" 
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workMode">Work Mode</Label>
                <select 
                  id="workMode"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={(WORK_MODES.includes(form.workMode || '') || form.workMode === '') ? (form.workMode || '') : 'Custom'} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val !== 'Custom') setForm(f => ({ ...f, workMode: val }));
                    else setForm(f => ({ ...f, workMode: 'Flexible' }));
                  }}
                >
                  <option value="">Select Work Mode</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="Custom">Custom...</option>
                </select>
                {form.workMode !== '' && !WORK_MODES.includes(form.workMode || '') && (
                  <Input 
                    className="mt-2" 
                    value={form.workMode || ''} 
                    onChange={e => setForm(f => ({ ...f, workMode: e.target.value }))} 
                    placeholder="Enter custom work mode" 
                    autoFocus
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <select 
                  id="location"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={(LOCATIONS.includes(form.location || '') || form.location === '') ? (form.location || '') : 'Custom'} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val !== 'Custom') setForm(f => ({ ...f, location: val }));
                    else setForm(f => ({ ...f, location: 'Other City' }));
                  }}
                >
                  <option value="">Select Location</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                  <option value="Custom">Custom...</option>
                </select>
                {form.location !== '' && !LOCATIONS.includes(form.location || '') && (
                  <Input 
                    className="mt-2" 
                    value={form.location || ''} 
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                    placeholder="Enter custom location" 
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Content) *</Label>
              <Textarea 
                id="description" 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                placeholder="Job responsibilities, benefits..." 
                className="min-h-[150px]"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : (modal === 'edit' ? 'Update Position' : 'Create Position')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Position?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the job posting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => handleDelete(deleteConfirm!)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
