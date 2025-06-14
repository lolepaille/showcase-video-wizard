
import React from 'react';
import { Button } from '@/components/ui/button';
import { Scissors, RotateCcw } from 'lucide-react';

interface VideoTrimmerActionsProps {
  trimmedDuration: number;
  isTrimming: boolean;
  onCancel: () => void;
  onTrimVideo: () => void;
}

const VideoTrimmerActions: React.FC<VideoTrimmerActionsProps> = ({
  trimmedDuration,
  isTrimming,
  onCancel,
  onTrimVideo
}) => {
  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="px-6"
          disabled={isTrimming}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        <Button
          onClick={onTrimVideo}
          disabled={trimmedDuration < 0.5 || isTrimming}
          className="px-6 bg-green-600 hover:bg-green-700"
        >
          <Scissors className="h-4 w-4 mr-2" />
          Apply Trim
        </Button>
      </div>

      {trimmedDuration < 0.5 && (
        <p className="text-center text-sm text-red-600">
          Minimum trim duration is 0.5 seconds
        </p>
      )}
    </div>
  );
};

export default VideoTrimmerActions;
