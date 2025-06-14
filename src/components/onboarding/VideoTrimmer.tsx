
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, X } from 'lucide-react';
import VideoPlayer from './video-trimmer/VideoPlayer';
import TrimControls from './video-trimmer/TrimControls';
import TrimProgress from './video-trimmer/TrimProgress';
import VideoTrimmerActions from './video-trimmer/VideoTrimmerActions';
import ErrorDisplay from './video-trimmer/ErrorDisplay';
import { useVideoTrimmer } from './video-trimmer/hooks/useVideoTrimmer';

interface VideoTrimmerProps {
  videoBlob?: Blob;
  videoUrl?: string;
  onTrimComplete: (trimmedBlob: Blob) => void;
  onCancel: () => void;
  title?: string;
}

const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ 
  videoBlob, 
  videoUrl, 
  onTrimComplete, 
  onCancel,
  title = "Trim Your Video"
}) => {
  if (!videoBlob && !videoUrl) {
    throw new Error("VideoTrimmer requires either videoBlob or videoUrl prop");
  }

  const {
    videoRef,
    videoUrl: internalVideoUrl,
    isPlaying,
    isLoaded,
    currentTime,
    duration,
    startTime,
    endTime,
    isTrimming,
    trimProgress,
    error,
    trimmedDuration,
    togglePlayPause,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleVideoError,
    handleCurrentTimeChange,
    handleStartTimeChange,
    handleEndTimeChange,
    trimVideo,
    cancelTrimming,
    retryTrimming,
  } = useVideoTrimmer({ 
    videoBlob: videoBlob || undefined, 
    videoUrl: videoUrl || undefined, 
    onTrimComplete 
  });

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <Scissors className="h-5 w-5" />
          {title}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="ml-auto"
            disabled={isTrimming}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <p className="text-muted-foreground">
          Select the start and end points to trim your video
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ErrorDisplay error={error} onRetry={isLoaded && !isTrimming ? retryTrimming : undefined} />

        <div className="relative">
          <VideoPlayer
            videoRef={videoRef}
            videoUrl={internalVideoUrl}
            isPlaying={isPlaying}
            isLoaded={isLoaded}
            currentTime={currentTime}
            duration={duration}
            onTogglePlayPause={togglePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onVideoError={handleVideoError}
          />
          
          <TrimProgress
            isVisible={isTrimming}
            progress={trimProgress}
            onCancel={cancelTrimming}
          />
        </div>

        {isLoaded && !isTrimming && (
          <div className="space-y-4">
            <TrimControls
              currentTime={currentTime}
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              onCurrentTimeChange={handleCurrentTimeChange}
              onStartTimeChange={handleStartTimeChange}
              onEndTimeChange={handleEndTimeChange}
            />

            <VideoTrimmerActions
              trimmedDuration={trimmedDuration}
              isTrimming={isTrimming}
              onCancel={onCancel}
              onTrimVideo={trimVideo}
            />
          </div>
        )}
        {!isLoaded && !error && (
             <div className="text-center p-4 text-muted-foreground">Loading video preview... If this persists, the video might be corrupted or in an unsupported format.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoTrimmer;
