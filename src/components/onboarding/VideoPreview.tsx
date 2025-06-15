
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Clock } from 'lucide-react';

interface VideoPreviewProps {
  videoBlob?: Blob;
  startTime?: number;
  endTime?: number;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  videoBlob, 
  startTime = 0, 
  endTime 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useRef<string>('');

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      console.log('VideoPreview: Setting up video with blob:', videoBlob.size, 'bytes, type:', videoBlob.type);
      
      // Clean up previous URL
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
      
      // Create new URL for the blob
      videoUrl.current = URL.createObjectURL(videoBlob);
      console.log('VideoPreview: Created video URL:', videoUrl.current);
      
      const video = videoRef.current;
      video.src = videoUrl.current;
      
      // Reset states
      setIsLoaded(false);
      setLoadError('');
      setCurrentTime(startTime);
      setDuration(0);
      setIsPlaying(false);
      
      // Force load
      video.load();
    }

    return () => {
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
    };
  }, [videoBlob, startTime]);

  const togglePlayPause = () => {
    if (videoRef.current && isLoaded) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Start from the specified start time
        videoRef.current.currentTime = startTime;
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (isFinite(time)) {
        setCurrentTime(time);
        
        // Auto-pause at end time if specified
        if (endTime && time >= endTime) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      console.log('VideoPreview: Video duration loaded:', dur);
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
        setIsLoaded(true);
        setLoadError('');
        // Set initial time to start time
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
    }
  };

  const handleCanPlay = () => {
    console.log('VideoPreview: Video can play');
    setIsLoaded(true);
    setLoadError('');
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = (e.target as HTMLVideoElement).error;
    console.error('VideoPreview: Video error:', error);
    setLoadError(`Failed to load video: ${error?.message || 'Unknown error'}`);
    setIsLoaded(false);
  };

  const handleSliderChange = (value: number[]) => {
    if (videoRef.current && isLoaded && value[0] >= 0) {
      const time = Math.max(startTime, Math.min(value[0], endTime || duration));
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePlay = () => {
    console.log('VideoPreview: Video started playing');
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    console.log('VideoPreview: Video paused');
    setIsPlaying(false);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const effectiveEndTime = endTime || duration;
  const playbackDuration = effectiveEndTime - startTime;

  if (!videoBlob) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Play className="h-5 w-5" />
          Video Preview
        </h3>
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            No video recorded. Please go back to record your video.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Play className="h-5 w-5" />
        Video Preview
        {isLoaded && duration > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : formatTime(duration)}
          </span>
        )}
      </h3>
      
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={() => setIsPlaying(false)}
            onError={handleError}
            preload="metadata"
            controls={false}
            playsInline
          />
          
          {!isLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}
          
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <p className="text-red-400 mb-2">Error loading video</p>
                <p className="text-sm">{loadError}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Custom Video Controls */}
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              disabled={!isLoaded}
              className="flex items-center gap-2"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            {isLoaded && duration > 0 && (
              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm text-muted-foreground min-w-[40px]">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  min={startTime}
                  max={effectiveEndTime}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[40px]">
                  {formatTime(effectiveEndTime)}
                </span>
              </div>
            )}
          </div>
          
          {isLoaded && duration > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              {endTime ? (
                <>Playback Duration: {formatTime(playbackDuration)} (from {formatTime(startTime)} to {formatTime(endTime)})</>
              ) : (
                <>Video Duration: {formatTime(duration)}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
