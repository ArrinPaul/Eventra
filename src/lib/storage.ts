import { supabase } from './supabase/client';

export function useStorage() {
  /**
   * Upload a file to Supabase Storage
   * @param file The file to upload (should already be optimized to 520x520)
   * @param bucket The storage bucket name (default: 'eventra-uploads')
   */
  const uploadFile = async (file: File, bucket: string = 'eventra-uploads'): Promise<string> => {
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase Storage:', error);
      // Fallback: return a temporary local URL so UI doesn't crash if upload fails
      return URL.createObjectURL(file);
    }
  };

  return { uploadFile };
}
