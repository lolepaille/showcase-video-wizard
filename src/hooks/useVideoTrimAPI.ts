
import { useState } from "react";

interface TrimVideoParams {
  videoUrl: string;
  start: number;
  end: number;
  onProgress?: (p: number) => void;
}

/**
 * Makes a call to the Supabase FFmpeg edge function to trim a video.
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
      const formData = new FormData();
      formData.append("video_url", videoUrl);
      formData.append("start", String(start));
      formData.append("end", String(end));

      // No progress supported for this edge function (could add SSE for big jobs)
      const resp = await fetch("/functions/v1/trim-video", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Failed to trim video");
      }
      const blob = await resp.blob();
      return blob;
    } catch (err) {
      setError((err as Error).message || "Unknown error");
      return null;
    } finally {
      setIsTrimming(false);
    }
  }

  return { trimVideo, isTrimming, error };
}
