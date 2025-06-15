
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Camera, Monitor, Presentation } from 'lucide-react';

type RecordingMode = 'camera' | 'screen' | 'both';

interface RecordingControlsProps {
  isRecording: boolean;
  recordedBlob: Blob | null;
  recordingMode: RecordingMode;
  showRotateOverlay: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayPreview: () => void;
  onResetRecording: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  recordedBlob,
  recordingMode,
  showRotateOverlay,
  onStartRecording,
  onStopRecording,
  onPlayPreview,
  onResetRecording
}) => {
  return (
    <div className="flex justify-center gap-4">
      {!isRecording && !recordedBlob && !showRotateOverlay && (
        <Button
          onClick={onStartRecording}
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          {recordingMode === 'camera' && <Camera className="h-5 w-5 mr-2" />}
          {recordingMode === 'screen' && <Monitor className="h-5 w-5 mr-2" />}
          {recordingMode === 'both' && <Presentation className="h-5 w-5 mr-2" />}
          Start Recording
        </Button>
      )}

      {isRecording && (
        <Button
          onClick={onStopRecording}
          size="lg"
          variant="outline"
          className="border-red-600 text-red-600 hover:bg-red-50 px-8"
        >
          <Square className="h-5 w-5 mr-2" />
          Stop Recording
        </Button>
      )}

      {recordedBlob && !isRecording && (
        <div className="flex gap-4">
          <Button
            onClick={onPlayPreview}
            size="lg"
            variant="outline"
            className="px-6"
          >
            <Play className="h-5 w-5 mr-2" />
            Preview
          </Button>
          <Button
            onClick={onResetRecording}
            size="lg"
            variant="outline"
            className="px-6"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Re-record
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
