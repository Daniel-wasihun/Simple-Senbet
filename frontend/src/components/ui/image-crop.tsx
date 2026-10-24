"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Input } from "./input";

interface EasyImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: File) => void;
  aspectRatio?: number;
  title?: string;
  description?: string;
  initialImageSrc?: string | null;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function EasyImageCropper({
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio = 16 / 9,
  title = "Crop Image",
  description,
  initialImageSrc = null,
}: EasyImageCropperProps) {
  const [imgSrc, setImgSrc] = React.useState<string | null>(initialImageSrc);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] =
    React.useState<PixelCrop | null>(null);

  React.useEffect(() => {
    setImgSrc(initialImageSrc);
  }, [initialImageSrc, isOpen]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  };

  const handleCrop = () => {
  if (!imgRef.current || !completedCrop) return;

  const canvas = document.createElement("canvas");
  const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
  const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

  canvas.width = completedCrop.width;
  canvas.height = completedCrop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(
    imgRef.current,
    completedCrop.x * scaleX,
    completedCrop.y * scaleY,
    completedCrop.width * scaleX,
    completedCrop.height * scaleY,
    0,
    0,
    completedCrop.width,
    completedCrop.height
  );

  canvas.toBlob((blob) => {
    if (!blob) return;

    const file = new File([blob], "cropped.jpg", {
      type: "image/jpeg",
    });

    onCropComplete(file);
    onClose();
  }, "image/jpeg", 0.9);
};


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>{title}</DialogTitle>
          {description && (
            <DialogDescription className={undefined}>{description}</DialogDescription>
          )}
        </DialogHeader>

        {!imgSrc && (
          <Input type="file" accept="image/*" onChange={onSelectFile} />
        )}

        {imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(_, percent) => setCrop(percent)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-h-[400px]"
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop"
              onLoad={onImageLoad}
            />
          </ReactCrop>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary-gradient" onClick={handleCrop} disabled={!completedCrop}>
            Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
