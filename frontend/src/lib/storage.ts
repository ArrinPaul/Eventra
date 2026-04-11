export function useStorage() {
  const uploadFile = async (file: File): Promise<string> => {
    // Phase-0 fallback: use browser object URL until backend storage is wired.
    return Promise.resolve(URL.createObjectURL(file));
  };

  return { uploadFile };
}
