
import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Submission } from '@/hooks/useShowcase';

interface VideoDialogProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoEnd: () => void;
}

const VideoDialog: React.FC<VideoDialogProps> = ({ 
  submission, 
  isOpen, 
  onClose, 
  onVideoEnd 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Extract trim times safely as numbers
  const startTime: number | undefined = submission && submission.notes && typeof submission.notes.startTime === 'number'
    ? submission.notes.startTime
    : (submission && submission.notes && submission.notes.startTime !== undefined
      ? Number(submission.notes.startTime)
      : undefined);
  const endTime: number | undefined = submission && submission.notes && typeof submission.notes.endTime === 'number'
    ? submission.notes.endTime
    : (submission && submission.notes && submission.notes.endTime !== undefined
      ? Number(submission.notes.endTime)
      : undefined);

  // Handle playback logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !submission?.video_url) return;

    const onLoadedMetadata = () => {
      if (typeof startTime === 'number' && startTime > 0 && startTime < video.duration) {
        console.log('[Trim] Setting video start time to:', startTime);
        video.currentTime = startTime;
      }
    };

    const handleTimeUpdate = () => {
      if (typeof endTime === 'number' && endTime > 0) {
        if (video.currentTime >= endTime) {
          console.log('[Trim] Reached endTime - pausing video at:', endTime);
          video.pause();
          onVideoEnd();
        }
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
    // Only re-run if a different video is selected
    // eslint-disable-next-line
  }, [submission?.video_url, startTime, endTime]); 

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        {submission && (
          <div className="relative w-full h-full bg-black">
            {submission.video_url ? (
              <video
                ref={videoRef}
                src={submission.video_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
                // No trimming logic here; handled by useEffect
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-2">
                    {submission.full_name}
                  </h3>
                  <p className="text-gray-300">Video not available</p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center gap-4 text-white">
                {submission.profile_picture_url ? (
                  <img
                    src={submission.profile_picture_url}
                    alt={submission.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-lg">
                    {submission.full_name.charAt(0)}
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{submission.full_name}</h3>
                  {submission.title && (
                    <p className="text-gray-300">{submission.title}</p>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    {submission.cluster}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog;

