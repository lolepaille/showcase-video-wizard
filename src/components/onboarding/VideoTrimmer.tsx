
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, X } from 'lucide-react';
import VideoPlayer from './video-trimmer/VideoPlayer';
import TrimControls from './video-trimmer/TrimControls';
import TrimProgress from './video-trimmer/TrimProgress';
import VideoTrimmerActions from './video-trimmer/VideoTrimmerActions';
import ErrorDisplay from './video-trimmer/ErrorDisplay';

interface VideoTrimmerProps {
  videoBlob: Blob;
  onTrimComplete: (trimmedBlob: Blob) => void;
  onCancel: () => void;
}

const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ videoBlob, onTrimComplete, onCancel }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useRef<string>('');

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      // Clean up previous URL
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
      
      // Create new URL for the blob
      videoUrl.current = URL.createObjectURL(videoBlob);
      
      // Reset states
      setIsLoaded(false);
      setCurrentTime(0);
      setDuration(0);
      setStartTime(0);
      setEndTime(0);
      setIsPlaying(false);
      setError('');
    }

    return () => {
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
    };
  }, [videoBlob]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
        setEndTime(dur);
        setIsLoaded(true);
        console.log('Video loaded successfully, duration:', dur);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (isFinite(time)) {
        setCurrentTime(time);
        
        // Auto-pause at end time during preview
        if (time >= endTime && isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current && isLoaded) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Jump to start time if we're not in the selected range
        if (currentTime < startTime || currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleStartTimeChange = (value: number[]) => {
    const newStart = Math.min(value[0], endTime - 0.1);
    setStartTime(newStart);
    
    if (videoRef.current && currentTime < newStart) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleEndTimeChange = (value: number[]) => {
    const newEnd = Math.max(value[0], startTime + 0.1);
    setEndTime(newEnd);
    
    if (videoRef.current && currentTime > newEnd) {
      videoRef.current.currentTime = newEnd;
    }
  };

  const handleCurrentTimeChange = (value: number[]) => {
    if (videoRef.current && isLoaded) {
      const time = Math.max(startTime, Math.min(value[0], endTime));
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const trimVideo = async () => {
    if (!videoRef.current || !isLoaded) return;

    setIsTrimming(true);
    setTrimProgress(0);
    setError('');
    
    try {
      console.log('Starting video trim process...');
      
      // Use a simpler approach with MediaRecorder
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Create a stream from canvas
      const stream = canvas.captureStream(30);
      
      // Try to add audio track if the original video has audio
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        destination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (audioError) {
        console.warn('Could not add audio track:', audioError);
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, creating blob...');
        const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
        onTrimComplete(trimmedBlob);
        setIsTrimming(false);
        setTrimProgress(100);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Error during video trimming. Please try again.');
        setIsTrimming(false);
      };
      
      // Start recording
      mediaRecorder.start();
      console.log('MediaRecorder started');
      
      // Set video to start time and play
      video.currentTime = startTime;
      
      const trimDuration = endTime - startTime;
      let recordingStartTime = Date.now();
      
      video.onseeked = () => {
        video.play();
        recordingStartTime = Date.now();
        
        // Update progress
        const progressInterval = setInterval(() => {
          const elapsed = (Date.now() - recordingStartTime) / 1000;
          const progress = Math.min((elapsed / trimDuration) * 100, 100);
          setTrimProgress(progress);
          
          // Draw current frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          if (elapsed >= trimDuration) {
            clearInterval(progressInterval);
            video.pause();
            mediaRecorder.stop();
          }
        }, 100);
      };
      
    } catch (error) {
      console.error('Error trimming video:', error);
      setError('Failed to trim video. Please try again.');
      setIsTrimming(false);
      setTrimProgress(0);
    }
  };

  const cancelTrimming = () => {
    setIsTrimming(false);
    setTrimProgress(0);
    setError('');
    console.log('Video trimming cancelled');
  };

  const retryTrimming = () => {
    setError('');
    setTrimProgress(0);
    trimVideo();
  };

  const trimmedDuration = endTime - startTime;

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <Scissors className="h-5 w-5" />
          Trim Your Video
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
        <ErrorDisplay error={error} onRetry={retryTrimming} />

        <div className="relative">
          <VideoPlayer
            videoRef={videoRef}
            isPlaying={isPlaying}
            isLoaded={isLoaded}
            currentTime={currentTime}
            duration={duration}
            onTogglePlayPause={togglePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            videoUrl={videoUrl.current}
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
      </CardContent>
    </Card>
  );
};

export default VideoTrimmer;
