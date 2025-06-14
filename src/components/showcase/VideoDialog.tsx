
import React from 'react';
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        {submission && (
          <div className="relative w-full h-full bg-black">
            {submission.video_url ? (
              <video
                src={submission.video_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onEnded={onVideoEnd}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  const startTime = submission.notes?.startTime;
                  const endTime = submission.notes?.endTime;
                  
                  console.log('Video loaded with trim settings:', { 
                    submissionId: submission.id,
                    startTime, 
                    endTime,
                    notes: submission.notes 
                  });
                  
                  if (startTime !== undefined && startTime > 0) {
                    console.log('Setting video start time to:', startTime);
                    video.currentTime = startTime;
                  }
                  
                  // Handle end time during playback
                  if (endTime !== undefined && endTime > 0) {
                    const handleTimeUpdate = () => {
                      if (video.currentTime >= endTime) {
                        console.log('Video reached end time, stopping playback');
                        video.pause();
                        video.removeEventListener('timeupdate', handleTimeUpdate);
                        onVideoEnd();
                      }
                    };
                    
                    video.addEventListener('timeupdate', handleTimeUpdate);
                    
                    // Cleanup function
                    return () => {
                      video.removeEventListener('timeupdate', handleTimeUpdate);
                    };
                  }
                }}
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
              <div className="text-white">
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog;
