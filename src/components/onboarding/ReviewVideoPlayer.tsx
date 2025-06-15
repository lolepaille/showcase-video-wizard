
import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Replace, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ReviewVideoPlayerProps {
  blob: Blob;
  onReplace: () => void;
}

const ReviewVideoPlayer: React.FC<ReviewVideoPlayerProps> = ({ blob, onReplace }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Create/revoke URL when blob changes
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    setIsLoaded(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    return () => {
      URL.revokeObjectURL(url);
      setVideoUrl(null);
      setIsLoaded(false);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    };
  }, [blob]);

  // Handlers
  const handleLoadedMetadata = () => {
    const dur = videoRef.current?.duration ?? 0;
    setDuration(Number.isFinite(dur) && dur > 0 ? dur : 0);
    setIsLoaded(Number.isFinite(dur) && dur > 0);
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const newTime = Number.isFinite(videoRef.current.currentTime)
      ? videoRef.current.currentTime
      : 0;
    setCurrentTime(newTime);
    if (duration && newTime >= duration) setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (!videoRef.current || !isLoaded) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  const handleSliderChange = (v: number[]) => {
    if (!videoRef.current || !isLoaded || !duration) return;
    const sliderVal = Array.isArray(v) && Number.isFinite(v[0]) ? v[0] : 0;
    if (sliderVal >= 0 && sliderVal <= duration) {
      videoRef.current.currentTime = sliderVal;
      setCurrentTime(sliderVal);
    }
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
        <Play className="h-5 w-5" />
        Video Preview
        {isLoaded && duration > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground ml-3">
            <Clock className="h-4 w-4" />
            {formatTime(duration)}
          </span>
        )}
      </h3>
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          preload="metadata"
          controls={false}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onPause}
          onError={(e) => {
            setIsLoaded(false);
            setIsPlaying(false);
            console.error("[ReviewVideoPlayer] Error", e);
          }}
          src={videoUrl || undefined}
          tabIndex={0}
          aria-label="Video preview"
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
      <div className="flex flex-col items-center gap-3 mt-2 max-w-2xl mx-auto px-2">
        {/* Slider */}
        <div className="w-full flex items-center gap-3 justify-center max-w-xl">
          <span className="text-muted-foreground text-sm min-w-[45px] text-center">
            {formatTime(currentTime)}
          </span>
          <Slider
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.05}
            value={[
              Math.min(Math.max(currentTime, 0), duration > 0 ? duration : 1),
            ]}
            onValueChange={handleSliderChange}
            disabled={!isLoaded || !(duration > 0)}
            className="flex-1"
          />
          <span className="text-muted-foreground text-sm min-w-[45px] text-center">
            {formatTime(duration)}
          </span>
        </div>
        <div className="flex justify-center items-center gap-3 w-full mt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            disabled={!isLoaded}
            className="flex items-center gap-2"
            type="button"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1"
            onClick={onReplace}
            type="button"
          >
            <Replace className="h-4 w-4" />
            Replace Video
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewVideoPlayer;
