import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useStorage() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);

  const uploadFile = async (file: File, userId: string) => {
    // 1. Get a short-lived upload URL
    const postUrl = await generateUploadUrl();

    // 2. POST the file to the URL
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!result.ok) {
      throw new Error(`Upload failed: ${result.statusText}`);
    }

    const { storageId } = await result.json();

    // 3. Save the storage ID and metadata to the database
    const fileId = await saveFile({
      storageId,
      name: file.name,
      contentType: file.type,
      size: file.size,
      userId: userId as any,
    });

    // 4. Return the storageId or the entry ID
    return { storageId, fileId };
  };

  return { uploadFile };
}