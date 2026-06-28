'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onUpload, disabled = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl border" />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ''; }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop an image here or <span className="text-primary font-medium">click to browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
        </div>
      )}
    </div>
  );
}
