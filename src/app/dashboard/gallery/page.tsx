'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Upload, Link as LinkIcon, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  category: string | null;
  createdAt: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [category, setCategory] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/gallery');
      if (r.ok) {
        const data = await r.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  function openCreate() {
    setUploadFile(null);
    setPreviewUrl(null);
    setAltText('');
    setCategory('');
    setError('');
    setModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!altText) setAltText(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select an image file first.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("folder", "gallery");
      formData.append("subFolder", category || "uncategorized");

      const upRes = await fetch("/api/upload", {
        method: "POST", body: formData,
      });

      if (!upRes.ok) throw new Error("Image upload failed");
      const { url } = await upRes.json();

      const dbRes = await fetch('/api/gallery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: altText || 'Untitled', imageUrl: url, category: category || null })
      });

      if (!dbRes.ok) throw new Error("Failed to save to database");

      setModalOpen(false);
      loadGallery();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadGallery();
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url);
    alert('Image URL copied to clipboard!');
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Media Gallery</h1>
          <p className="text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadGallery} size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreate} className="flex-1 md:flex-none">
            <Upload className="mr-2 h-4 w-4" /> Upload Image
          </Button>
        </div>
      </div>

      <Card className="flex-1 bg-transparent border-none shadow-none">
        <CardContent className="p-0 h-full">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground bg-card border rounded-xl shadow-sm h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground bg-card border rounded-xl shadow-sm h-64">
              <div className="mb-4 opacity-50">
                <ImageIcon className="w-16 h-16" />
              </div>
              <p>No images uploaded yet.</p>
              <Button onClick={openCreate} variant="outline" className="mt-4">
                <Upload className="mr-2 h-4 w-4" /> Upload First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map(item => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden bg-card border border-border shadow-sm aspect-square transition-all hover:border-primary hover:shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate mb-2">{item.title}</p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="h-7 px-2 flex-1 text-xs" onClick={() => copyToClipboard(item.imageUrl)}>
                        <LinkIcon className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteConfirm(item.id)}>
                        <Trash2 className="h-3.w w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Select an image from your computer to add to the CMS gallery.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Image File *</Label>
                <Input id="file-upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="cursor-pointer" />
              </div>

              {previewUrl ? (
                <div className="rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border flex flex-col items-center justify-center p-8 h-48 text-muted-foreground bg-muted/10">
                  <Upload className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Preview will appear here</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="alt-text">Alt Text / Name</Label>
                <Input id="alt-text" value={altText} onChange={e => setAltText(e.target.value)} placeholder="e.g. Warehouse exterior shot" />
                <p className="text-[0.8rem] text-muted-foreground">Useful for accessibility directly in the gallery</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">Collection / Category</Label>
                <Input id="collection" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Warehousing" />
                <p className="text-[0.8rem] text-muted-foreground">This will also be the folder name in storage</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !uploadFile}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Uploading...' : 'Upload Image'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Image?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This image will be permanently removed from the database (R2 storage file might be kept depending on configuration).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => handleDelete(deleteConfirm!)}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
