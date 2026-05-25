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

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
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
    // Revoke old object URLs to prevent memory leaks
    uploadItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setUploadItems([]);
    setCategory('');
    setError('');
    setModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newItems: UploadItem[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, "")
      }));
      setUploadItems(prev => [...prev, ...newItems]);
    }
  }

  function removeUploadItem(id: string) {
    setUploadItems(prev => {
      const target = prev.find(item => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  }

  function updateUploadItemTitle(id: string, title: string) {
    setUploadItems(prev => prev.map(item => item.id === id ? { ...item, title } : item));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (uploadItems.length === 0) {
      setError('Please select at least one image file.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Process parallel uploads to R2 and D1 database insertions
      await Promise.all(uploadItems.map(async (item) => {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("folder", "gallery");
        formData.append("subFolder", category || "uncategorized");

        const upRes = await fetch("/api/upload", {
          method: "POST", body: formData,
        });

        if (!upRes.ok) throw new Error(`Upload failed for "${item.file.name}"`);
        const { url } = await upRes.json();

        const dbRes = await fetch('/api/gallery', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: item.title || 'Untitled', 
            imageUrl: url, 
            category: category || null 
          })
        });

        if (!dbRes.ok) throw new Error(`Failed to save "${item.title}" to database`);
      }));

      // Cleanup object URLs to avoid memory leaks
      uploadItems.forEach(item => URL.revokeObjectURL(item.previewUrl));

      setModalOpen(false);
      loadGallery();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during batch upload');
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
            <Upload className="mr-2 h-4 w-4" /> Upload Images
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>
              Select one or multiple images from your computer to add to the CMS gallery.
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
                <Label htmlFor="file-upload">Image Files *</Label>
                <Input id="file-upload" type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileChange} className="cursor-pointer" />
              </div>

              {uploadItems.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Upload Queue ({uploadItems.length} image{uploadItems.length !== 1 ? 's' : ''})</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {uploadItems.map(item => (
                      <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card shadow-sm items-center relative group">
                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-border bg-muted/30 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Input 
                            value={item.title} 
                            onChange={e => updateUploadItemTitle(item.id, e.target.value)} 
                            placeholder="Title / Alt Text" 
                            className="h-8 text-xs font-medium"
                          />
                          <p className="text-[0.65rem] text-muted-foreground truncate">{item.file.name}</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => removeUploadItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border flex flex-col items-center justify-center p-8 h-48 text-muted-foreground bg-muted/10">
                  <Upload className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Selected image previews will appear here</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="collection">Collection / Category (Applies to all)</Label>
                <Input id="collection" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. GLA Shenzhen 2026" />
                <p className="text-[0.8rem] text-muted-foreground">This will also be the folder name in storage</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || uploadItems.length === 0}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? `Uploading (${uploadItems.length})...` : `Upload ${uploadItems.length > 0 ? uploadItems.length : ''} Image${uploadItems.length !== 1 ? 's' : ''}`}
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
