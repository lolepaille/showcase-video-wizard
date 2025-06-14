
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VideoViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  submissionName: string;
}

const VideoViewerDialog: React.FC<VideoViewerDialogProps> = ({
  isOpen,
  onClose,
  videoUrl,
  submissionName
}) => {
  if (!videoUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Video: {submissionName}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoViewerDialog;
