import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, targetWidth = null, targetHeight = null) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Use custom dimensions if provided, otherwise use crop dimensions
  const finalWidth = targetWidth || pixelCrop.width;
  const finalHeight = targetHeight || pixelCrop.height;

  canvas.width = finalWidth;
  canvas.height = finalHeight;

  // If custom dimensions are different, scale the image
  if (targetWidth || targetHeight) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = pixelCrop.width;
    tempCanvas.height = pixelCrop.height;
    
    tempCtx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );
    
    ctx.drawImage(tempCanvas, 0, 0, finalWidth, finalHeight);
  } else {
    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export default function ImageCropModal({ open, onClose, imageSrc, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(1); // 1:1 square by default

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', {
        type: 'image/jpeg',
      });
      onCropComplete(croppedFile);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  const aspectRatios = [
    { label: 'Square', value: 1 },
    { label: 'Portrait', value: 4 / 5 },
    { label: 'Landscape', value: 16 / 9 },
    { label: 'Free', value: null },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper */}
          <div className="relative w-full h-[400px] bg-black/5 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteHandler}
            />
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex gap-2 flex-wrap">
            {aspectRatios.map((ratio) => (
              <Button
                key={ratio.label}
                type="button"
                variant={aspect === ratio.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAspect(ratio.value)}
              >
                {ratio.label}
              </Button>
            ))}
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                Zoom
              </label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Rotation
              </label>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
