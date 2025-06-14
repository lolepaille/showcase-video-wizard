
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrimVideoParams {
  videoUrl: string;
  start: number;
  end: number;
  onProgress?: (p: number) => void;
}

interface TrimResult {
  videoUrl: string;
  startTime: number;
  endTime: number;
}

/**
 * Instead of actually trimming the video, we just store the start and end times
 * for playback control in the showcase.
 */
export function useVideoTrimAPI() {
  const [isTrimming, setIsTrimming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trimVideo({
    videoUrl,
    start,
    end,
    onProgress,
  }: TrimVideoParams): Promise<TrimResult | null> {
    setIsTrimming(true);
    setError(null);
    
    try {
      console.log('Setting video trim times:', { videoUrl, start, end });
      
      // Simulate a brief processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return the original video URL with trim times
      const result: TrimResult = {
        videoUrl,
        startTime: start,
        endTime: end
      };
      
      console.log('Trim times set successfully:', result);
      return result;
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
