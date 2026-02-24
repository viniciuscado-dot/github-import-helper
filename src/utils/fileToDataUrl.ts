/**
 * Converts a File object to a persistent base64 data URL.
 * Unlike Blob URLs, data URLs survive page reloads and localStorage serialization.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Returns a persistent URL for a file entry.
 * If it's already a data: URL or persisted URL, returns as-is.
 * If it's a File, converts to base64 data URL.
 */
export async function toPersistentUrl(entry: File | { url: string; name: string }): Promise<string> {
  if (entry instanceof File) {
    return fileToDataUrl(entry);
  }
  // Already a data URL or previously persisted URL
  if (entry.url.startsWith('data:')) {
    return entry.url;
  }
  // Blob URL — try to fetch and convert (may fail if revoked)
  if (entry.url.startsWith('blob:')) {
    try {
      const resp = await fetch(entry.url);
      const blob = await resp.blob();
      return fileToDataUrl(new File([blob], entry.name, { type: blob.type }));
    } catch {
      return entry.url; // fallback
    }
  }
  return entry.url;
}
