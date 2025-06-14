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
  const mediaRecorderInstanceRef = useRef<MediaRecorder | null>(null);
  const progressIntervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
        console.log('VideoTrimmer: Old video URL revoked:', videoUrl.current);
      }
      
      videoUrl.current = URL.createObjectURL(videoBlob);
      console.log('VideoTrimmer: New video URL created:', videoUrl.current);
      
      setIsLoaded(false);
      setCurrentTime(0);
      setDuration(0);
      setStartTime(0);
      setEndTime(0);
      setIsPlaying(false);
      setError('');
      // The VideoPlayer component will set the src and trigger load
    }

    return () => {
      if (videoUrl.current) {
        console.log('VideoTrimmer: Revoking video URL on cleanup:', videoUrl.current);
        URL.revokeObjectURL(videoUrl.current);
        videoUrl.current = '';
      }
      if (progressIntervalIdRef.current) {
        clearInterval(progressIntervalIdRef.current);
        progressIntervalIdRef.current = null;
      }
      if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state !== 'inactive') {
        mediaRecorderInstanceRef.current.stop();
      }
      mediaRecorderInstanceRef.current = null;
    };
  }, [videoBlob]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
        setEndTime(dur);
        setIsLoaded(true);
        setError(''); // Clear previous errors on successful load
        console.log('VideoTrimmer: Video loaded successfully, duration:', dur);
      } else {
        console.error('VideoTrimmer: Invalid duration detected on load:', dur, 'Video URL:', videoUrl.current);
        setError(`Failed to load video metadata. The video duration is invalid (reported: ${dur}). Please try re-recording or using a different video.`);
        setIsLoaded(false);
        setDuration(0);
        setEndTime(0);
      }
    }
  };

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = event.currentTarget;
    let errorMsg = 'An unknown video error occurred.';
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case videoElement.error.MEDIA_ERR_ABORTED: errorMsg = 'Video playback aborted by user or script.'; break;
        case videoElement.error.MEDIA_ERR_NETWORK: errorMsg = 'A network error caused the video download to fail part-way.'; break;
        case videoElement.error.MEDIA_ERR_DECODE: errorMsg = 'Video playback aborted due to a corruption problem or because the video used features your browser did not support.'; break;
        case videoElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMsg = 'The video could not be loaded, either because the server or network failed or because the format is not supported.'; break;
        default: errorMsg = `An unknown video error occurred (code: ${videoElement.error.code}).`;
      }
    }
    console.error('VideoTrimmer: Video element error event:', errorMsg, videoElement.error);
    setError(errorMsg + ' Please try re-recording, using a different video, or check your network connection.');
    setIsLoaded(false);
    setIsTrimming(false);
    if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state !== 'inactive') {
      mediaRecorderInstanceRef.current.stop();
    }
    if (progressIntervalIdRef.current) {
      clearInterval(progressIntervalIdRef.current);
      progressIntervalIdRef.current = null;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (isFinite(time)) {
        setCurrentTime(time);
        
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
        if (currentTime < startTime || currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play().catch(err => {
          console.error("VideoTrimmer: Error toggling play/pause:", err);
          handleVideoError(err as any); 
        });
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleStartTimeChange = (value: number[]) => {
    const newStart = Math.min(value[0], endTime - 0.1); // Ensure start is less than end
    setStartTime(Math.max(0, newStart)); // Ensure start is not negative
    
    if (videoRef.current && currentTime < newStart) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleEndTimeChange = (value: number[]) => {
    const newEnd = Math.max(value[0], startTime + 0.1); // Ensure end is greater than start
    setEndTime(Math.min(duration, newEnd)); // Ensure end does not exceed duration
    
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
    if (!videoRef.current || !isLoaded) {
      setError('Video not loaded or ready. Cannot trim.');
      console.error('VideoTrimmer: trimVideo called but video not ready. isLoaded:', isLoaded);
      return;
    }

    if (!isFinite(duration) || duration <= 0) {
      setError('Video duration is invalid. Cannot trim.');
      console.error('VideoTrimmer: Invalid duration before trimming:', duration);
      return;
    }
    if (!isFinite(startTime) || startTime < 0 || startTime >= duration) {
      setError('Invalid start time for trimming.');
      console.error('VideoTrimmer: Invalid start time:', startTime, 'Duration:', duration);
      return;
    }
    if (!isFinite(endTime) || endTime <= startTime || endTime > duration) {
      setError('Invalid end time for trimming.');
      console.error('VideoTrimmer: Invalid end time:', endTime, 'Duration:', duration, 'Start time:', startTime);
      return;
    }

    const calculatedTrimDuration = endTime - startTime;
    if (calculatedTrimDuration < 0.1) { // Minimum trim duration
        setError('Trim duration is too short (min 0.1s).');
        console.error('VideoTrimmer: Invalid calculatedTrimDuration:', calculatedTrimDuration);
        return;
    }

    setIsTrimming(true);
    setTrimProgress(0);
    setError('');
    
    try {
      console.log('VideoTrimmer: Starting video trim process...');
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setError('Failed to get canvas context for trimming.');
        setIsTrimming(false);
        return;
      }
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('VideoTrimmer: Video dimensions are zero. videoWidth:', video.videoWidth, 'videoHeight:', video.videoHeight);
        setError('Video dimensions are invalid. Cannot trim.');
        setIsTrimming(false);
        return;
      }
      console.log('VideoTrimmer: Canvas dimensions for trimming:', canvas.width, 'x', canvas.height);
      
      const stream = canvas.captureStream(30); // 30 FPS
      
      try {
        if (video.srcObject && (video.srcObject as MediaStream).getAudioTracks().length > 0) {
           (video.srcObject as MediaStream).getAudioTracks().forEach(track => stream.addTrack(track.clone()));
        } else if (videoRef.current.src && (videoRef.current as any).mozHasAudio !== false && (videoRef.current as any).webkitAudioDecodedByteCount !== undefined) { // Fixed TS2339
            const audioContext = new AudioContext();
            const sourceNode = audioContext.createMediaElementSource(video);
            const destNode = audioContext.createMediaStreamDestination();
            sourceNode.connect(destNode);
            destNode.stream.getAudioTracks().forEach(track => stream.addTrack(track));
        }
      } catch (audioError) {
        console.warn('VideoTrimmer: Could not add audio track to trimmed video:', audioError);
      }
      
      let mimeTypeToUse = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) {
          setError('Your browser does not support required video recording formats for trimming.');
          setIsTrimming(false);
          return;
      }
      console.log("VideoTrimmer: Using mimeType: ", mimeTypeToUse);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeTypeToUse });
      mediaRecorderInstanceRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('VideoTrimmer: MediaRecorder stopped, creating blob...');
        if (progressIntervalIdRef.current) {
          clearInterval(progressIntervalIdRef.current);
          progressIntervalIdRef.current = null;
        }
        if (chunks.length > 0) {
            const trimmedBlob = new Blob(chunks, { type: mimeTypeToUse });
            onTrimComplete(trimmedBlob);
        } else {
            setError('Trimming resulted in an empty video. Please try again.');
            console.error('VideoTrimmer: No data chunks recorded.');
        }
        setIsTrimming(false);
        setTrimProgress(100); 
        mediaRecorderInstanceRef.current = null;
      };
      
      mediaRecorder.onerror = (event: Event) => { // event is type ErrorEvent
        console.error('VideoTrimmer: MediaRecorder error:', event);
        if (progressIntervalIdRef.current) {
          clearInterval(progressIntervalIdRef.current);
          progressIntervalIdRef.current = null;
        }
        setError('Error during video trimming. Please try again.');
        setIsTrimming(false);
        mediaRecorderInstanceRef.current = null;
      };
      
      mediaRecorder.start();
      console.log('VideoTrimmer: MediaRecorder started');
      
      video.pause(); 
      video.currentTime = startTime;
      console.log('VideoTrimmer: Set video currentTime to startTime:', startTime);
      
      video.onseeked = async () => {
        console.log('VideoTrimmer: Video seeked to startTime.');
        try {
          await video.play();
          console.log('VideoTrimmer: Video playback started for frame capture.');
          
          let frameCaptureStartTime = Date.now();
          
          progressIntervalIdRef.current = setInterval(() => {
            if (!videoRef.current || !mediaRecorderInstanceRef.current || mediaRecorderInstanceRef.current.state !== 'recording') {
              if (progressIntervalIdRef.current) clearInterval(progressIntervalIdRef.current);
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const elapsed = (Date.now() - frameCaptureStartTime) / 1000;
            const progress = Math.min((elapsed / calculatedTrimDuration) * 100, 100);
            setTrimProgress(progress);
            
            if (videoRef.current.currentTime >= endTime || elapsed >= calculatedTrimDuration + 0.5 ) { 
              if (progressIntervalIdRef.current) clearInterval(progressIntervalIdRef.current);
              progressIntervalIdRef.current = null;
              
              if (videoRef.current) videoRef.current.pause();
              if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state === 'recording') {
                mediaRecorderInstanceRef.current.stop();
              }
              console.log('VideoTrimmer: Trimming duration reached or passed.');
            }
          }, Math.floor(1000 / 30)) as unknown as number; 

        } catch (playError) {
          console.error('VideoTrimmer: Error starting playback after seek:', playError);
          setError('Failed to start video playback for trimming.');
          if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state !== 'inactive') {
            mediaRecorderInstanceRef.current.stop();
          }
          setIsTrimming(false);
        }
      };
      
      const seekTimeout = setTimeout(() => {
        if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state === 'recording' && !progressIntervalIdRef.current) {
            console.error('VideoTrimmer: Seek operation timed out or did not complete as expected.');
            setError('Video seeking failed or timed out. Cannot trim.');
            if (mediaRecorderInstanceRef.current.state !== 'inactive') {
                 mediaRecorderInstanceRef.current.stop();
            }
            setIsTrimming(false);
        }
      }, 5000); 

      const originalOnStop = mediaRecorder.onstop;
      mediaRecorder.onstop = (event: Event) => { // Fixed TS2554 by adding event and using .call
        clearTimeout(seekTimeout);
        if (originalOnStop) {
          // 'this' for onstop is the MediaRecorder itself.
          originalOnStop.call(mediaRecorder, event);
        }
      };
      const originalOnError = mediaRecorder.onerror;
      mediaRecorder.onerror = (event: Event) => { // Fixed TS2684 by adding event type and using .call
        clearTimeout(seekTimeout);
        if (originalOnError) {
          // 'this' for onerror is the MediaRecorder itself.
          originalOnError.call(mediaRecorder, event);
        }
      }
      if (video.onseeked) {
          const originalOnSeeked = video.onseeked as (this: HTMLVideoElement, ev: Event) => any; // Cast for safety
          video.onseeked = (event: Event) => {
              clearTimeout(seekTimeout);
              if (typeof originalOnSeeked === 'function') {
                originalOnSeeked.call(video, event);
              }
          }
      }


    } catch (trimError) {
      console.error('VideoTrimmer: Error in trimVideo function:', trimError);
      setError('Failed to trim video due to an unexpected error. Please try again.');
      setIsTrimming(false);
      setTrimProgress(0);
      if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state !== 'inactive') {
        mediaRecorderInstanceRef.current.stop();
      }
       if (progressIntervalIdRef.current) {
          clearInterval(progressIntervalIdRef.current);
          progressIntervalIdRef.current = null;
        }
    }
  };

  const cancelTrimming = () => {
    console.log('VideoTrimmer: cancelTrimming called.');
    if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state !== 'inactive') {
      // Detach handlers to prevent them from running after explicit stop
      // This is important if the original handlers might cause side effects we don't want on cancel
      (mediaRecorderInstanceRef.current as MediaRecorder).onstop = null; 
      (mediaRecorderInstanceRef.current as MediaRecorder).ondataavailable = null;
      (mediaRecorderInstanceRef.current as MediaRecorder).onerror = null;
      mediaRecorderInstanceRef.current.stop();
      console.log('VideoTrimmer: MediaRecorder stopped by cancelTrimming.');
    }
    mediaRecorderInstanceRef.current = null;

    if (progressIntervalIdRef.current) {
      clearInterval(progressIntervalIdRef.current);
      progressIntervalIdRef.current = null;
      console.log('VideoTrimmer: Progress interval cleared by cancelTrimming.');
    }
    
    if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
    }

    setIsTrimming(false);
    setTrimProgress(0);
    // setError(''); // Don't clear error on cancel, user might want to see it
    console.log('VideoTrimmer: Video trimming process cancelled by user action.');
  };

  const retryTrimming = () => {
    console.log('VideoTrimmer: Retrying trimming.');
    setError('');
    setTrimProgress(0);
    setIsTrimming(false); 
    if (mediaRecorderInstanceRef.current || progressIntervalIdRef.current) {
        cancelTrimming();
    }
    trimVideo();
  };

  const trimmedDuration = (isLoaded && duration > 0) ? Math.max(0, endTime - startTime) : 0;

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
        <ErrorDisplay error={error} onRetry={isLoaded && !isTrimming ? retryTrimming : undefined} />

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
            onVideoError={handleVideoError}
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
        {!isLoaded && !error && (
             <div className="text-center p-4 text-muted-foreground">Loading video preview... If this persists, the video might be corrupted or in an unsupported format.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoTrimmer;
