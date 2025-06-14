
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, X } from 'lucide-react';
import { useVideoTrimAPI } from '@/hooks/useVideoTrimAPI';
import ErrorDisplay from './video-trimmer/ErrorDisplay';

interface VideoTrimmerProps {
  videoBlob?: Blob;
  videoUrl?: string;
  onTrimComplete: (videoUrl: string, startTime?: number, endTime?: number) => void;
  onCancel: () => void;
  title?: string;
}

const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  videoBlob,
  videoUrl,
  onTrimComplete,
  onCancel,
  title = "Set Video Playback Times"
}) => {
  const playerRef = useRef<HTMLVideoElement>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);

  // Make URL from Blob if provided
  const blobUrl = videoBlob ? URL.createObjectURL(videoBlob) : undefined;
  const src = blobUrl || videoUrl || "";

  const { trimVideo, isTrimming, error } = useVideoTrimAPI();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLoadedMetadata = () => {
    if (playerRef.current && playerRef.current.duration) {
      setDuration(playerRef.current.duration);
      setEnd(playerRef.current.duration);
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(Number(e.target.value), end ?? duration));
    setStart(val);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(duration, Math.max(Number(e.target.value), start));
    setEnd(val);
  };

  const handleSubmit = async () => {
    setLocalError(null);
    
    // Use the provided URL or convert blob to URL if needed
    let actualUrl = videoUrl || src;
    
    if (videoBlob && !videoUrl) {
      setLocalError("Please upload the video to get a URL before setting trim times.");
      return;
    }

    if (!end || end <= start) {
      setLocalError("End time must be after start time.");
      return;
    }

    if (!actualUrl) {
      setLocalError("No video URL available.");
      return;
    }

    console.log('Setting trim times for URL:', actualUrl);
    
    const result = await trimVideo({
      videoUrl: actualUrl,
      start,
      end,
    });
    
    if (result) {
      console.log('Trim times set successfully');
      onTrimComplete(result.videoUrl, result.startTime, result.endTime);
    } else {
      console.error('Setting trim times failed');
      setLocalError("Setting trim times failed. Please try again.");
    }
  };

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
          Set the start and end times for video playback in the showcase
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <ErrorDisplay error={error} />}
        {localError && <ErrorDisplay error={localError} />}
        <div className="flex flex-col items-center gap-4">
          <video
            ref={playerRef}
            src={src}
            controls
            className="max-w-full rounded-lg"
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
          />
          <div className="w-full flex flex-col md:flex-row gap-2 items-center justify-center">
            <label>
              Start (s)
              <input
                disabled={isTrimming}
                type="number"
                min={0}
                step={0.1}
                max={end ?? duration}
                value={start}
                onChange={handleStartChange}
                className="ml-1 w-20 border rounded p-1"
              />
            </label>
            <label>
              End (s)
              <input
                disabled={isTrimming}
                type="number"
                min={start}
                step={0.1}
                max={duration}
                value={end ?? duration}
                onChange={handleEndChange}
                className="ml-1 w-20 border rounded p-1"
              />
            </label>
            <span className="text-muted-foreground ml-2">
              Duration: {duration ? duration.toFixed(2) : '...'} seconds
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isTrimming}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isTrimming}>
            {isTrimming ? "Setting..." : "Set Playback Times"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoTrimmer;
