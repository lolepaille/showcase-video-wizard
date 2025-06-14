
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Scissors, RotateCcw, X } from 'lucide-react';

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
      const video = videoRef.current;
      video.src = videoUrl.current;
      
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

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={retryTrimming}
                className="text-red-600 border-red-300"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            muted
            playsInline
          />
          
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {/* Trimming Progress Overlay */}
          {isTrimming && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium">Trimming Video...</p>
                <p className="text-sm">{Math.round(trimProgress)}% Complete</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelTrimming}
                  className="mt-4 text-white border-white hover:bg-white hover:text-black"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {isLoaded && !isTrimming && (
          <div className="space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isPlaying ? 'Pause' : 'Play Preview'}
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Timeline Scrubber */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Current Position</div>
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleCurrentTimeChange}
                className="w-full"
              />
            </div>

            {/* Trim Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>Start Time</span>
                  <span className="text-muted-foreground">{formatTime(startTime)}</span>
                </div>
                <Slider
                  value={[startTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleStartTimeChange}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>End Time</span>
                  <span className="text-muted-foreground">{formatTime(endTime)}</span>
                </div>
                <Slider
                  value={[endTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleEndTimeChange}
                  className="w-full"
                />
              </div>
            </div>

            {/* Trim Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <h4 className="font-medium text-blue-800">Trimmed Duration</h4>
                <p className="text-2xl font-bold text-blue-600">{formatTime(trimmedDuration)}</p>
                <p className="text-sm text-blue-700 mt-1">
                  From {formatTime(startTime)} to {formatTime(endTime)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="px-6"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                onClick={trimVideo}
                disabled={trimmedDuration < 0.5}
                className="px-6 bg-green-600 hover:bg-green-700"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Apply Trim
              </Button>
            </div>

            {trimmedDuration < 0.5 && (
              <p className="text-center text-sm text-red-600">
                Minimum trim duration is 0.5 seconds
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoTrimmer;
