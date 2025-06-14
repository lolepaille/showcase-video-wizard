
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

      // Use the Supabase functions invoke method instead of direct fetch
      const { data, error: functionError } = await supabase.functions.invoke('trim-video', {
        body: formData,
      });

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw new Error(functionError.message || "Failed to trim video");
      }

      // The response should be a blob
      if (data instanceof Blob) {
        console.log('Trim successful, received blob of size:', data.size);
        return data;
      } else {
        console.error('Unexpected response type:', typeof data);
        throw new Error("Invalid response from trim service");
      }
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
