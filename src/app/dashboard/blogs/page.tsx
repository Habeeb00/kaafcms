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
import { Loader2, Plus, Edit2, Trash2, PenTool } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ImageCropper from '@/components/ImageCropper';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface Blog {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  imageUrl: string | null;
  author: string | null;
  authorImageUrl: string | null;
  readTime: string | null;
  content: string;
  likes: number;
  createdAt: string;
}

const BLANK: Omit<Blog, 'id' | 'createdAt'> = { title: '', slug: '', category: '', imageUrl: '', content: '', author: '', authorImageUrl: '', readTime: '', likes: 0 };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Cropping State
  const [cropContext, setCropContext] = useState<{
    image: string;
    field: 'imageUrl' | 'authorImageUrl';
    aspect: number;
    title: string;
  } | null>(null);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/blogs');
    const data = await r.json();
    setBlogs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const handleFileUploadSelection = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'authorImageUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropContext({
        image: reader.result as string,
        field,
        aspect: field === 'imageUrl' ? 2 / 1 : 1 / 1, // 2:1 for blog, 1:1 for author
        title: field === 'imageUrl' ? 'Crop Blog Header' : 'Crop Author Profile'
      });
    };
    reader.readAsDataURL(file);
    // Clear the input so selecting the same file again triggers change
    e.target.value = '';
  };

  const performUpload = async (blob: Blob) => {
    if (!cropContext) return;
    
    setSaving(true);
    try {
      const field = cropContext.field;
      const formData = new FormData();
      formData.append("file", blob, `cropped-${Date.now()}.jpg`);
      formData.append("folder", "blogs");
      formData.append("subFolder", form.slug || "uncategorized");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      
      setForm(f => ({ ...f, [field]: url }));
      setCropContext(null);
    } catch(err) {
      alert("Failed to upload image.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  function openCreate() { setForm(BLANK); setEditId(null); setError(''); setModal('create'); }
  function openEdit(b: Blog) {
    setForm({ 
      title: b.title, 
      slug: b.slug, 
      category: b.category || '', 
      imageUrl: b.imageUrl || '', 
      content: b.content,
      author: b.author || '',
      authorImageUrl: b.authorImageUrl || '',
      readTime: b.readTime || '',
      likes: b.likes || 0
    });
    setEditId(b.id); setError(''); setModal('edit');
  }
  function closeModal() { setModal(null); setEditId(null); }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    setForm(f => ({ ...f, title, slug: modal === 'create' ? slugify(title) : f.slug }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const url = modal === 'edit' ? `/api/blogs/${editId}` : '/api/blogs';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return; }
      closeModal(); loadBlogs();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadBlogs();
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Blog Posts</h1>
          <p className="text-muted-foreground">{blogs.length} post{blogs.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={openCreate} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      <Card className="flex-1">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
              <div className="mb-4 opacity-50">
                <PenTool className="w-16 h-16" />
              </div>
              <p>No blog posts yet. Create your first one!</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium max-w-[260px] truncate" title={b.title}>
                          {b.title}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-muted-foreground">/{b.slug}</code>
                        </TableCell>
                        <TableCell>
                          {b.category ? <Badge variant="secondary">{b.category}</Badge> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {b.likes}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
                              <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(b.id)} className="px-2">
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
                {blogs.map(b => (
                  <Card key={b.id}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-semibold">{b.title}</div>
                        {b.category && <Badge variant="secondary" className="shrink-0">{b.category}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                        <code className="bg-muted px-1 rounded">/{b.slug}</code>
                        <span>{b.likes} Likes</span>
                        <span>•</span>
                        <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 pt-3 border-t mt-1">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(b)}>
                          <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => setDeleteConfirm(b.id)}>
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
            <DialogTitle>{modal === 'edit' ? 'Edit Post' : 'New Blog Post'}</DialogTitle>
            <DialogDescription>
              {modal === 'edit' ? 'Make changes to your post here.' : 'Fill out the details for your new blog post.'}
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
                <Label htmlFor="blog-title">Title *</Label>
                <Input id="blog-title" value={form.title} onChange={handleTitleChange} required placeholder="Post title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-slug">Slug *</Label>
                <Input id="blog-slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required placeholder="my-post-slug" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blog-category">Category</Label>
                {/* Fallback to standard styled select for easy "Custom" handling */}
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={["Sustainability", "Logistics", "Technology", "Future", "Warehouse", "Sea Freight", "Trade", "General", ""].includes(form.category || '') ? (form.category || '') : 'Custom'} 
                  onChange={e => {
                    if (e.target.value !== 'Custom') setForm(f => ({ ...f, category: e.target.value }));
                    else setForm(f => ({ ...f, category: 'Custom Category' }));
                  }}
                >
                  <option value="">Select Category...</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Technology">Technology</option>
                  <option value="Future">Future</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Sea Freight">Sea Freight</option>
                  <option value="Trade">Trade</option>
                  <option value="General">General</option>
                  <option value="Custom">Custom...</option>
                </select>
                {!["Sustainability", "Logistics", "Technology", "Future", "Warehouse", "Sea Freight", "Trade", "General", ""].includes(form.category || '') && (
                  <Input className="mt-2" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Enter custom category" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-image">Blog Image</Label>
                <Input type="file" id="blog-image" accept="image/*" onChange={(e) => handleFileUploadSelection(e, 'imageUrl')} />
                {form.imageUrl && <img src={form.imageUrl} alt="preview" className="mt-2 max-h-20 rounded-md object-cover" />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blog-author">Author</Label>
                <Input id="blog-author" value={form.author || ''} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="e.g. Jacob George" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-author-image">Author Image</Label>
                <Input type="file" id="blog-author-image" accept="image/*" onChange={(e) => handleFileUploadSelection(e, 'authorImageUrl')} />
                {form.authorImageUrl && <img src={form.authorImageUrl} alt="Author preview" className="mt-2 h-10 w-10 rounded-full object-cover" />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-read-time">Read Time</Label>
                <Input id="blog-read-time" value={form.readTime || ''} onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))} placeholder="e.g. 5 min read" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-likes">Likes</Label>
                <Input id="blog-likes" type="number" value={form.likes} onChange={e => setForm(f => ({ ...f, likes: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <div className="border rounded-md overflow-hidden bg-background">
                <RichTextEditor value={form.content} onChange={html => setForm(f => ({ ...f, content: html }))} placeholder="Start writing your post…" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : (modal === 'edit' ? 'Update Post' : 'Publish Post')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
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

      {cropContext && (
        <ImageCropper
          image={cropContext.image}
          aspect={cropContext.aspect}
          title={cropContext.title}
          onCropComplete={performUpload}
          onCancel={() => setCropContext(null)}
        />
      )}
    </div>
  );
}
