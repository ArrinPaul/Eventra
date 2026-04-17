'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
  Download,
  Eye,
  Heart,
  Share2,
  Clock,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  uploadEventMedia, 
  getEventGallery, 
  trackMediaEngagement,
  moderateMedia 
} from '@/app/actions/media';
import { cn } from '@/core/utils/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EventGalleryProps {
  eventId: string;
  isRegistered: boolean;
  isStaff?: boolean;
}

export function EventGallery({ eventId, isRegistered, isStaff }: EventGalleryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEventGallery(eventId);
      setPhotos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // In a real app, you'd upload to ImageKit/Cloudinary first
      // For this implementation, we simulate the storage logic with a temporary URL
      // (Assuming a storage service like Supabase Storage or Vercel Blob is configured)
      
      const storageId = `img_${Date.now()}`;
      // In a real environment, we'd use the actual uploaded URL
      const mockUrl = URL.createObjectURL(file); 

      await uploadEventMedia({
        eventId,
        url: mockUrl,
        storageId,
        caption: ""
      });

      toast({ 
        title: isStaff ? "Photo shared!" : "Photo submitted!", 
        description: isStaff ? "Your photo is now live." : "Wait for an organizer to approve your photo." 
      });
      loadPhotos();
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEngagement = async (mediaId: string, type: 'view' | 'download') => {
    await trackMediaEngagement(mediaId, type);
    // Silent update in background
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await moderateMedia(mediaId, 'reject');
      setPhotos(prev => prev.filter(p => p.id !== mediaId));
      setSelectedPhoto(null);
      toast({ title: "Photo removed" });
    } catch (e) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white italic flex items-center gap-3">
              LIVE GALLERY <Camera className="text-primary" size={24} />
            </h2>
            <p className="text-sm text-muted-foreground">Authentic moments captured by the community.</p>
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
                className="bg-white text-black hover:bg-primary/90 rounded-xl font-bold h-11 px-6 shadow-lg shadow-white/5"
              >
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                SHARE MOMENT
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : photos.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-border/60 rounded-[2rem] bg-muted/20">
            <Camera size={64} className="mx-auto mb-4 text-gray-800 opacity-20" />
            <h3 className="text-xl font-black text-muted-foreground italic">GALLERY EMPTY</h3>
            <p className="text-sm text-muted-foreground mt-1">Be the first to immortalize this event!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <Card 
                key={photo.id} 
                className="bg-muted/40 border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-all rounded-2xl"
                onClick={() => {
                  setSelectedPhoto(photo);
                  handleEngagement(photo.id, 'view');
                }}
              >
                <div className="relative aspect-square">
                  <Image 
                    src={photo.url} 
                    alt="event moment" 
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                        <Eye size={20} />
                        <span className="text-[10px] font-black mt-1">{photo.viewCount}</span>
                     </div>
                     <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                        <Download size={20} />
                        <span className="text-[10px] font-black mt-1">{photo.downloadCount}</span>
                     </div>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between bg-background/40">
                   <div className="flex items-center gap-2 truncate">
                      <Avatar className="h-6 w-6 border border-border">
                        <AvatarImage src={photo.author.image} />
                        <AvatarFallback className="text-[8px] bg-primary/20 text-primary font-bold">
                          {photo.author.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-tighter">{photo.author.name}</span>
                   </div>
                   <Clock size={10} className="text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-5xl p-0 bg-background/95 border-border overflow-hidden rounded-[2rem]">
            {selectedPhoto && (
              <div className="relative flex flex-col md:flex-row h-full max-h-[85vh]">
                <div className="relative flex-1 bg-background flex items-center justify-center p-4">
                  <Image 
                    src={selectedPhoto.url} 
                    alt="full view" 
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="w-full md:w-96 bg-background p-8 flex flex-col">
                  <div className="space-y-8 flex-1">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={selectedPhoto.author.image} />
                          <AvatarFallback className="bg-primary/20 text-primary font-black">{selectedPhoto.author.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-black text-white italic tracking-tight">{selectedPhoto.author.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <Clock size={10} /> {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white"><Share2 size={18} /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Share Photo</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Metadata</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center">
                             <p className="text-[10px] text-muted-foreground uppercase mb-1">Views</p>
                             <p className="text-xl font-black text-white">{selectedPhoto.viewCount}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center">
                             <p className="text-[10px] text-muted-foreground uppercase mb-1">Downloads</p>
                             <p className="text-xl font-black text-white">{selectedPhoto.downloadCount}</p>
                          </div>
                       </div>
                    </div>

                    {selectedPhoto.caption && (
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-sm text-muted-foreground italic leading-relaxed">"{selectedPhoto.caption}"</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-10">
                    <Button 
                      className="w-full bg-primary hover:bg-primary text-white font-black h-12 rounded-xl"
                      onClick={() => {
                        handleEngagement(selectedPhoto.id, 'download');
                        window.open(selectedPhoto.url, '_blank');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" /> DOWNLOAD HIGH-RES
                    </Button>
                    
                    {(user?.id === selectedPhoto.author.id || isStaff) && (
                      <Button 
                        variant="ghost" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 font-bold h-12 rounded-xl"
                        onClick={() => handleDelete(selectedPhoto.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> REMOVE FROM GALLERY
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
