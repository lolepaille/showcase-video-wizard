
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';
import { useRecording } from './recording/useRecording';
import RecordingModeSelector from './recording/RecordingModeSelector';
import VideoPreview from './recording/VideoPreview';
import RecordingTips from './recording/RecordingTips';

const isRealMobile = () => {
  if (typeof window === "undefined") return false;
  const isSmall = window.innerWidth < 768;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return (
    isSmall &&
    /iPhone|Android|Mobile|iPad|iPod|Opera Mini|IEMobile|BlackBerry|webOS/i.test(ua)
  );
};

interface RecordingStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const RecordingStep: React.FC<RecordingStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const {
    isRecording,
    recordedBlob,
    recordingTime,
    recordingMode,
    cameraStream,
    screenStream,
    error,
    showRotateOverlay,
    cameraFacing,
    videoRef,
    pipVideoRef,
    canvasRef,
    startRecording,
    stopRecording,
    resetRecording,
    playPreview,
    setRecordingMode,
    setCameraFacing,
    setShowRotateOverlay
  } = useRecording({ updateData, data });

  // Scrolling and fullscreen handling
  const handleStartRecording = async () => {
    if (videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (isRealMobile() && videoContainerRef.current) {
      // Try to enter fullscreen
      const elem = videoContainerRef.current;
      // Several vendor-prefixed methods for iOS Safari, old Android, etc
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    }
    await startRecording();
  };

  const handleStopRecording = () => {
    if (isRealMobile() && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    stopRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Record Your Video</CardTitle>
          <p className="text-muted-foreground">
            Choose your recording mode and create a thoughtful response. Perfect for presentations or face-to-face communication.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Recording Mode Selection */}
          {!isRecording && !recordedBlob && (
            <RecordingModeSelector
              recordingMode={recordingMode}
              cameraFacing={cameraFacing}
              onRecordingModeChange={setRecordingMode}
              onCameraFacingChange={setCameraFacing}
            />
          )}

          {/* Video Preview Area + controls overlay & ref for scroll/fullscreen */}
          <div ref={videoContainerRef} className="relative">
            <VideoPreview
              videoRef={videoRef}
              pipVideoRef={pipVideoRef}
              recordingMode={recordingMode}
              cameraStream={cameraStream}
              screenStream={screenStream}
              recordedBlob={recordedBlob}
              isRecording={isRecording}
              recordingTime={recordingTime}
              showRotateOverlay={showRotateOverlay}
              onRotateOverlayClose={() => setShowRotateOverlay(false)}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onPlayPreview={playPreview}
              onResetRecording={resetRecording}
              showControlsOverlay={true}
              disableStart={!!error}
            />
            {/* Hidden canvas for compositing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {recordedBlob && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Recording Complete!</h4>
                  <p className="text-sm text-green-700">
                    Duration: {formatTime(recordingTime)} • Ready for review
                  </p>
                </div>
              </div>
            </div>
          )}

          <RecordingTips />

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onPrev} className="px-8">
              Back
            </Button>
            <Button 
              onClick={onNext}
              disabled={!recordedBlob}
              className="px-8 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            >
              Review & Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordingStep;

