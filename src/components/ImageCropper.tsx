'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ImageCropperProps {
  image: string; // Object URL
  aspect: number;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  title?: string;
}

export default function ImageCropper({ image, aspect, onCropComplete, onCancel, title = "Crop Image" }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = (crop: Point) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-6 overflow-hidden bg-background">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 bg-black rounded-lg overflow-hidden my-4 border border-border shadow-inner">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            showGrid={true}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              <span>Zoom Control</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <DialogFooter className="flex gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Processing...' : 'Apply Crop'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
