
import { useState } from "react";

interface TrimVideoParams {
  videoUrl: string;
  start: number;
  end: number;
  onProgress?: (p: number) => void;
}

/**
 * Makes a call to the Supabase Edge Function to trim a video.
 * Returns a Blob of the trimmed video.
 */
export function useVideoTrimAPI() {
  const [isTrimming, setIsTrimming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trimVideo({
    videoUrl,
    start,
    end,
    onProgress,
  }: TrimVideoParams): Promise<Blob | null> {
    setIsTrimming(true);
    setError(null);
    
    try {
      console.log('Starting video trim request:', { videoUrl, start, end });
      
      const formData = new FormData();
      formData.append("video_url", videoUrl);
      formData.append("start", String(start));
      formData.append("end", String(end));

      // Make direct fetch call to the edge function
      const response = await fetch(`https://mzprzuwbpknbzgtbmzix.supabase.co/functions/v1/trim-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cHJ6dXdicGtuYnpndGJteml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3OTM0ODUsImV4cCI6MjA2NTM2OTQ4NX0.sywWkN89zNLlTl69XGwN13xqb-OT-__UBlVSaHYKlTM`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cHJ6dXdicGtuYnpndGJteml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3OTM0ODUsImV4cCI6MjA2NTM2OTQ4NX0.sywWkN89zNLlTl69XGwN13xqb-OT-__UBlVSaHYKlTM',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Trim request failed:', response.status, errorText);
        throw new Error(`Trim request failed: ${response.status} ${errorText}`);
      }

      // Get the response as a blob
      const blob = await response.blob();
      console.log('Trim successful, received blob of size:', blob.size);
      
      return blob;
    } catch (err) {
      console.error('Trim video error:', err);
      const errorMessage = (err as Error).message || "Unknown error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsTrimming(false);
    }
  }

  return { trimVideo, isTrimming, error };
}
