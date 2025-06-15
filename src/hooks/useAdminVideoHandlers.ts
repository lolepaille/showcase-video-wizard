
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Submission } from '@/components/admin/SubmissionForms';

export function useAdminVideoHandlers(toast: (opts: any) => void, setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>, setError: (e: string) => void) {
  const [trimmingVideo, setTrimmingVideo] = useState<Submission | null>(null);
  const [viewingVideo, setViewingVideo] = useState<Submission | null>(null);

  const handleTrimVideoClick = (submission: Submission) => {
    if (!submission.video_url) {
      setError('No video URL found for this submission');
      return;
    }
    setTrimmingVideo(submission);
  };

  const handleViewVideo = (submission: Submission) => {
    setViewingVideo(submission);
  };

  const handleTrimComplete = async (videoUrl: string, startTime?: number, endTime?: number) => {
    if (!trimmingVideo) return;
    try {
      const { error: updateError } = await supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: JSON.stringify({
          id: trimmingVideo.id,
          video_url: videoUrl,
          notes: {
            ...trimmingVideo.notes,
            startTime,
            endTime
          }
        })
      });
      if (updateError) {
        throw new Error('Failed to update submission with trim times');
      }
      setSubmissions(prev =>
        prev.map(s => s.id === trimmingVideo.id ? {
          ...s,
          video_url: videoUrl,
          notes: {
            ...s.notes,
            startTime,
            endTime
          }
        } : s)
      );
      toast({
        title: "Success",
        description: "Video playback times set successfully",
      });
      setTrimmingVideo(null);
    } catch (err) {
      setError('Failed to save video playback times');
    }
  };

  return {
    trimmingVideo,
    setTrimmingVideo,
    viewingVideo,
    setViewingVideo,
    handleTrimVideoClick,
    handleViewVideo,
    handleTrimComplete,
  };
}
