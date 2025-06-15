
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Monitor, Presentation, AlertTriangle, RotateCw } from 'lucide-react';

type RecordingMode = 'camera' | 'screen' | 'both';

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  pipVideoRef: React.RefObject<HTMLVideoElement>;
  recordingMode: RecordingMode;
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  recordedBlob: Blob | null;
  isRecording: boolean;
  recordingTime: number;
  showRotateOverlay: boolean;
  onRotateOverlayClose: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoRef,
  pipVideoRef,
  recordingMode,
  cameraStream,
  screenStream,
  recordedBlob,
  isRecording,
  recordingTime,
  showRotateOverlay,
  onRotateOverlayClose
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
      <video
        ref={videoRef}
        autoPlay
        muted={isRecording}
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Picture-in-Picture overlay for camera when recording both */}
      {recordingMode === 'both' && (cameraStream || isRecording) && (
        <div className="absolute bottom-4 right-4 w-32 h-24 border-2 border-white rounded-lg overflow-hidden">
          <video
            ref={pipVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Rotate Device Overlay */}
      {showRotateOverlay && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <div className="text-center text-white p-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <AlertTriangle className="h-16 w-16 text-amber-400 animate-pulse" />
                <RotateCw className="h-8 w-8 text-white absolute -bottom-2 -right-2 animate-spin" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Rotate Your Device</h3>
            <p className="text-lg mb-6 max-w-sm">
              Please rotate your device to landscape mode for the best recording experience.
            </p>
            <Button 
              onClick={onRotateOverlayClose}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              I'll try again
            </Button>
          </div>
        </div>
      )}
      
      {!cameraStream && !screenStream && !recordedBlob && !showRotateOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            {recordingMode === 'camera' && <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />}
            {recordingMode === 'screen' && <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />}
            {recordingMode === 'both' && <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />}
            <p className="text-lg">Click "Start Recording" to begin</p>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
        </div>
      )}

      {isRecording && recordingTime >= 110 && (
        <div className="absolute bottom-4 left-4 right-4 bg-amber-600 text-white px-3 py-2 rounded text-center">
          <span className="font-medium">10 seconds remaining!</span>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
