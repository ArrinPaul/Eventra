'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Image as ImageIcon, 
  Plus, 
  X, 
  Loader2, 
  Camera, 
  Trash2, 
  Maximize2,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface EventGalleryProps {
  eventId: Id<"events">;
  isRegistered: boolean;
}

export function EventGallery({ eventId, isRegistered }: EventGalleryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const photos = useQuery(api.gallery.getByEvent, { eventId }) || [];
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const uploadPhoto = useMutation(api.gallery.upload);
  const deletePhoto = useMutation(api.gallery.deletePhoto);

  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      
      await uploadPhoto({
        eventId,
        storageId,
        caption: ""
      });

      toast({ title: "Photo shared!" });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Gallery</h2>
          <p className="text-sm text-gray-500">Shared moments from the event.</p>
        </div>
        {isRegistered && (
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload} 
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-full"
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Share Photo
            </Button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <Camera size={48} className="mx-auto mb-4 text-gray-700 opacity-20" />
          <h3 className="text-lg font-bold text-gray-500">No photos yet</h3>
          <p className="text-sm text-gray-600">Be the first to share a moment!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div 
              key={photo._id} 
              className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-white/5"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img 
                src={photo.imageUrl} 
                alt="event" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white w-6 h-6" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={photo.authorImage} />
                    <AvatarFallback className="text-[8px] bg-cyan-500/20 text-cyan-400">
                      {photo.authorName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-white font-medium truncate">{photo.authorName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-white/10 overflow-hidden">
          {selectedPhoto && (
            <div className="relative flex flex-col md:flex-row h-full max-h-[80vh]">
              <div className="flex-1 bg-black flex items-center justify-center p-4">
                <img 
                  src={selectedPhoto.imageUrl} 
                  alt="full view" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="w-full md:w-80 bg-gray-900 p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedPhoto.authorImage} />
                      <AvatarFallback className="bg-cyan-500/20 text-cyan-400">{selectedPhoto.authorName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white">{selectedPhoto.authorName}</p>
                      <p className="text-xs text-gray-500">Shared on {new Date(selectedPhoto.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedPhoto.caption && <p className="text-sm text-gray-300 italic">"{selectedPhoto.caption}"</p>}
                </div>
                
                <div className="flex gap-2 mt-10">
                  <Button variant="outline" className="flex-1 border-white/10" asChild>
                    <a href={selectedPhoto.imageUrl} download target="_blank">
                      <Download className="w-4 h-4 mr-2" /> Download
                    </a>
                  </Button>
                  {(user?._id === selectedPhoto.userId) && (
                    <Button 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={async () => {
                        await deletePhoto({ id: selectedPhoto._id });
                        setSelectedPhoto(null);
                        toast({ title: "Photo deleted" });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
