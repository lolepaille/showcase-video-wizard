
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Clock } from 'lucide-react';

interface VideoPreviewProps {
  videoBlob?: Blob;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoBlob }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useRef<string>('');

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      console.log('Setting up video preview with blob:', videoBlob);
      
      // Clean up previous URL
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
      
      // Create new URL for the blob
      videoUrl.current = URL.createObjectURL(videoBlob);
      console.log('Created video URL:', videoUrl.current);
      
      const video = videoRef.current;
      video.src = videoUrl.current;
      
      // Reset states
      setIsLoaded(false);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }

    return () => {
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
    };
  }, [videoBlob]);

  const togglePlayPause = () => {
    if (videoRef.current && isLoaded) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (isFinite(time)) {
        setCurrentTime(time);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      console.log('Video duration loaded:', dur);
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
        setIsLoaded(true);
      }
    }
  };

  const handleCanPlay = () => {
    console.log('Video can play');
    setIsLoaded(true);
  };

  const handleSliderChange = (value: number[]) => {
    if (videoRef.current && isLoaded && value[0] >= 0) {
      const time = Math.min(value[0], duration);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePlay = () => {
    console.log('Video started playing');
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    console.log('Video paused');
    setIsPlaying(false);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
            {formatTime(duration)}
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
            onError={(e) => console.error('Video error:', e)}
            preload="metadata"
            controls={false}
          />
          
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading video...</p>
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
                  max={duration}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
            )}
          </div>
          
          {isLoaded && duration > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Video Duration: {formatTime(duration)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
