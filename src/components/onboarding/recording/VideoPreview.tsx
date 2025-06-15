
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Monitor, Presentation, AlertTriangle, RotateCw, Play, Square, RotateCcw } from 'lucide-react';
// Import the simple preview component
import SimpleVideoPreview from '../SimpleVideoPreview';

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
  // Overlay action buttons
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onPlayPreview?: () => void;
  onResetRecording?: () => void;
  showControlsOverlay?: boolean;
  disableStart?: boolean;
}

const formatTime = (seconds: number) => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  onRotateOverlayClose,
  onStartRecording,
  onStopRecording,
  onPlayPreview,
  onResetRecording,
  showControlsOverlay,
  disableStart,
}) => {
  // Timer clamp
  const safeTime = Math.max(0, Math.min(recordingTime, 120));
  const isActive = !!(cameraStream || screenStream || (recordedBlob && !isRecording));

  // For live recording, set up the video stream
  useEffect(() => {
    if (videoRef.current && isRecording) {
      if (recordingMode === 'camera' && cameraStream) {
        videoRef.current.srcObject = cameraStream;
      } else if (recordingMode === 'screen' && screenStream) {
        videoRef.current.srcObject = screenStream;
      } else if (recordingMode === 'both' && screenStream) {
        videoRef.current.srcObject = screenStream;
      }
    }
  }, [isRecording, cameraStream, screenStream, recordingMode]);

  // If we have a recorded blob and not recording, use the simple preview component
  if (recordedBlob && !isRecording) {
    return (
      <SimpleVideoPreview 
        videoBlob={recordedBlob} 
        onReRecord={onResetRecording}
      />
    );
  }

  // For live recording or before recording
  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
      <video
        ref={videoRef}
        autoPlay={isRecording}
        muted={isRecording}
        playsInline
        className="w-full h-full object-cover"
      />

      {/* PiP overlay for "both" mode */}
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

      {/* Overlay: Rotate device for mobile portrait */}
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

      {/* Overlay: Before starting - no streams */}
      {!isActive && !showRotateOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            {recordingMode === 'camera' && <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />}
            {recordingMode === 'screen' && <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />}
            {recordingMode === 'both' && <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />}
            <p className="text-lg">Click "Start Recording" to begin</p>
          </div>
        </div>
      )}

      {/* Overlay: Timer */}
      {isRecording && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-mono font-bold">{formatTime(safeTime)}</span>
        </div>
      )}

      {/* Overlay: End in 10s warning */}
      {isRecording && safeTime >= 110 && safeTime <= 120 && (
        <div className="absolute bottom-4 left-4 right-4 bg-amber-600 text-white px-3 py-2 rounded text-center">
          <span className="font-medium">10 seconds remaining!</span>
        </div>
      )}

      {/* ACTION BUTTON OVERLAYS */}
      {showControlsOverlay && (
        <div className="absolute inset-0 flex flex-col justify-end items-center pointer-events-none">
          <div className="pb-8 w-full flex justify-center">
          {/* Not recording, no blob: START RECORDING */}
          {!isRecording && !recordedBlob && !showRotateOverlay && (
            <Button
              onClick={onStartRecording}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 pointer-events-auto"
              disabled={disableStart}
            >
              {recordingMode === 'camera' && <Camera className="h-5 w-5 mr-2" />}
              {recordingMode === 'screen' && <Monitor className="h-5 w-5 mr-2" />}
              {recordingMode === 'both' && <Presentation className="h-5 w-5 mr-2" />}
              Start Recording
            </Button>
          )}

          {/* Is recording: Stop button */}
          {isRecording && (
            <Button
              onClick={onStopRecording}
              size="lg"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 px-8 pointer-events-auto"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
