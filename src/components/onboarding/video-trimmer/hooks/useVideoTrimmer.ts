import { useState, useRef, useEffect, useCallback } from 'react';

interface UseVideoTrimmerProps {
  videoBlob: Blob;
  onTrimComplete: (trimmedBlob: Blob) => void;
  // onCancel is not directly used by the hook's core logic for aborting trim,
  // but kept if needed for other cleanup specific to the hook's lifecycle.
  // The main component's onCancel handles UI dismissal.
}

export const useVideoTrimmer = ({ videoBlob, onTrimComplete }: UseVideoTrimmerProps) => {
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
  const videoUrlRef = useRef<string>(''); // Changed name to avoid conflict with returned videoUrl
  const mediaRecorderInstanceRef = useRef<MediaRecorder | null>(null);
  const progressIntervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        console.log('useVideoTrimmer: Old video URL revoked:', videoUrlRef.current);
      }
      
      videoUrlRef.current = URL.createObjectURL(videoBlob);
      console.log('useVideoTrimmer: New video URL created:', videoUrlRef.current);
      
      // Force reload of video if src is already set to new URL by VideoPlayer prop change
      // This ensures metadata is re-read for the new blob.
      if (videoRef.current.src === videoUrlRef.current) {
        videoRef.current.load(); 
      }
      // VideoPlayer component will update its src prop, which will also trigger a load.

      setIsLoaded(false);
      setCurrentTime(0);
      setDuration(0);
      setStartTime(0);
      setEndTime(0);
      setIsPlaying(false);
      setError('');
    }

    return () => {
      if (videoUrlRef.current) {
        console.log('useVideoTrimmer: Revoking video URL on cleanup:', videoUrlRef.current);
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = '';
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

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
        setEndTime(dur); // Initialize endTime to full duration
        setStartTime(0); // Initialize startTime to 0
        setIsLoaded(true);
        setError('');
        console.log('useVideoTrimmer: Video loaded successfully, duration:', dur);
      } else {
        console.error('useVideoTrimmer: Invalid duration detected on load:', dur, 'Video URL:', videoUrlRef.current);
        setError(`Failed to load video metadata. The video duration is invalid (reported: ${dur}). Please try re-recording or using a different video.`);
        setIsLoaded(false);
        setDuration(0);
        setEndTime(0);
        setStartTime(0);
      }
    }
  }, []);

  const handleVideoError = useCallback((event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
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
    console.error('useVideoTrimmer: Video element error event:', errorMsg, videoElement.error);
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
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (isFinite(time)) {
        setCurrentTime(time);
        if (isPlaying && time >= endTime) { // Use state `endTime`
          videoRef.current.pause();
          // setIsPlaying(false); // onPause handler will do this
        }
      }
    }
  }, [isPlaying, endTime]);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current && isLoaded) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play().catch(err => {
          console.error("useVideoTrimmer: Error toggling play/pause:", err);
          handleVideoError({ currentTarget: videoRef.current } as React.SyntheticEvent<HTMLVideoElement, Event>); 
        });
      }
    }
  }, [isLoaded, isPlaying, startTime, endTime, handleVideoError]);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleStartTimeChange = useCallback((value: number[]) => {
    const newStart = Math.min(value[0], endTime - 0.1);
    const validatedStart = Math.max(0, newStart);
    setStartTime(validatedStart);
    
    if (videoRef.current && videoRef.current.currentTime < validatedStart) {
      videoRef.current.currentTime = validatedStart;
      setCurrentTime(validatedStart); // Sync state
    }
  }, [endTime]);

  const handleEndTimeChange = useCallback((value: number[]) => {
    const newEnd = Math.max(value[0], startTime + 0.1);
    const validatedEnd = Math.min(duration, newEnd);
    setEndTime(validatedEnd);
    
    if (videoRef.current && videoRef.current.currentTime > validatedEnd) {
      videoRef.current.currentTime = validatedEnd;
      setCurrentTime(validatedEnd); // Sync state
    }
  }, [startTime, duration]);

  const handleCurrentTimeChange = useCallback((value: number[]) => {
    if (videoRef.current && isLoaded) {
      // Allow seeking anywhere for preview, but respect play range [startTime, endTime]
      const time = Math.max(0, Math.min(value[0], duration)); 
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [isLoaded, duration/*, startTime, endTime*/]);


  const trimVideo = useCallback(async () => {
    if (!videoRef.current || !isLoaded) {
      setError('Video not loaded or ready. Cannot trim.');
      console.error('useVideoTrimmer: trimVideo called but video not ready. isLoaded:', isLoaded);
      return;
    }
    const video = videoRef.current;

    if (!isFinite(duration) || duration <= 0) {
      setError('Video duration is invalid. Cannot trim.');
      console.error('useVideoTrimmer: Invalid duration before trimming:', duration);
      return;
    }
    if (!isFinite(startTime) || startTime < 0 || startTime >= duration) {
      setError('Invalid start time for trimming.');
      console.error('useVideoTrimmer: Invalid start time:', startTime, 'Duration:', duration);
      return;
    }
    if (!isFinite(endTime) || endTime <= startTime || endTime > duration) {
      setError('Invalid end time for trimming.');
      console.error('useVideoTrimmer: Invalid end time:', endTime, 'Duration:', duration, 'Start time:', startTime);
      return;
    }

    const calculatedTrimDuration = endTime - startTime;
    if (calculatedTrimDuration < 0.1) {
        setError('Trim duration is too short (min 0.1s).');
        console.error('useVideoTrimmer: Invalid calculatedTrimDuration:', calculatedTrimDuration);
        return;
    }

    setIsTrimming(true);
    setTrimProgress(0);
    setError('');
    
    try {
      console.log('useVideoTrimmer: Starting video trim process...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setError('Failed to get canvas context for trimming.');
        setIsTrimming(false);
        return;
      }
      
      canvas.width = video.videoWidth || 640; // Default if not available
      canvas.height = video.videoHeight || 480; // Default if not available
      
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('useVideoTrimmer: Video dimensions are zero. videoWidth:', video.videoWidth, 'videoHeight:', video.videoHeight);
        setError('Video dimensions are invalid (zero width or height). Cannot trim.');
        setIsTrimming(false);
        return;
      }
      console.log('useVideoTrimmer: Canvas dimensions for trimming:', canvas.width, 'x', canvas.height);
      
      const stream = canvas.captureStream(30); // 30 FPS
      
      try {
        // Fix the TypeScript error by properly casting the video element
        const videoWithCaptureStream = video as HTMLVideoElement & {
          captureStream?: () => MediaStream;
          mozCaptureStream?: () => MediaStream;
        };
        
        const videoSourceStream = videoWithCaptureStream.captureStream 
          ? videoWithCaptureStream.captureStream() 
          : videoWithCaptureStream.mozCaptureStream 
            ? videoWithCaptureStream.mozCaptureStream() 
            : null;
            
        if (videoSourceStream && videoSourceStream.getAudioTracks().length > 0) {
           videoSourceStream.getAudioTracks().forEach(track => stream.addTrack(track.clone()));
           console.log('useVideoTrimmer: Added audio track from video element stream.');
        } else if (videoBlob.type.startsWith('video/')) {
            // Fallback: If original blob has audio, try to use it
            // This is more complex and might not work directly with canvas captureStream
            // For simplicity, we'll rely on browser's captureStream including audio if possible.
            // Or, if audio must be mixed from original source, it requires more advanced Web Audio API usage.
            console.warn('useVideoTrimmer: Video element stream has no audio tracks. Trimmed video might be silent if browser does not mix it.');
        }
      } catch (audioError) {
        console.warn('useVideoTrimmer: Could not add audio track to trimmed video:', audioError);
      }
      
      let mimeTypeToUse = 'video/webm;codecs=vp9,opus'; //opus for audio
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm;codecs=vp9'; // vp9 without specific audio
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm;codecs=vp8'; // vp8 without specific audio
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) {
          setError('Your browser does not support required video recording formats for trimming.');
          setIsTrimming(false);
          return;
      }
      console.log("useVideoTrimmer: Using mimeType: ", mimeTypeToUse);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeTypeToUse });
      mediaRecorderInstanceRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      let seekTimeoutId: number | null = null;

      mediaRecorder.onstop = () => {
        console.log('useVideoTrimmer: MediaRecorder stopped, creating blob...');
        if (seekTimeoutId) clearTimeout(seekTimeoutId);
        if (progressIntervalIdRef.current) {
          clearInterval(progressIntervalIdRef.current);
          progressIntervalIdRef.current = null;
        }
        if (chunks.length > 0) {
            const trimmedBlob = new Blob(chunks, { type: mimeTypeToUse });
            console.log('useVideoTrimmer: Trimmed blob created, size:', trimmedBlob.size);
            onTrimComplete(trimmedBlob);
        } else {
            setError('Trimming resulted in an empty video. This might happen if the trim duration is too short or due to an encoding issue. Please try again.');
            console.error('useVideoTrimmer: No data chunks recorded.');
        }
        setIsTrimming(false);
        setTrimProgress(100); 
        mediaRecorderInstanceRef.current = null;
        stream.getTracks().forEach(track => track.stop()); // Clean up canvas stream tracks
      };
      
      mediaRecorder.onerror = (event: Event) => {
        console.error('useVideoTrimmer: MediaRecorder error:', event);
        if (seekTimeoutId) clearTimeout(seekTimeoutId);
        if (progressIntervalIdRef.current) {
          clearInterval(progressIntervalIdRef.current);
          progressIntervalIdRef.current = null;
        }
        setError('Error during video trimming process. Please try again.');
        setIsTrimming(false);
        mediaRecorderInstanceRef.current = null;
        stream.getTracks().forEach(track => track.stop()); // Clean up canvas stream tracks
      };
      
      mediaRecorder.start();
      console.log('useVideoTrimmer: MediaRecorder started');
      
      video.pause(); 
      video.currentTime = startTime;
      console.log('useVideoTrimmer: Set video currentTime to startTime:', startTime);
      
      const originalOnSeeked = video.onseeked;
      video.onseeked = async () => {
        if (typeof originalOnSeeked === 'function') {
          originalOnSeeked.call(video, new Event('seeked'));
        }
        if (seekTimeoutId) clearTimeout(seekTimeoutId);
        seekTimeoutId = null; // Clear timeout as seek was successful

        console.log('useVideoTrimmer: Video seeked to startTime.');
        try {
          // Ensure video is muted during this playback to avoid echo if audio is captured from it
          const originalMuted = video.muted;
          video.muted = true; 
          await video.play();
          video.muted = originalMuted; // Restore muted state

          console.log('useVideoTrimmer: Video playback started for frame capture.');
          
          let frameCaptureStartTime = Date.now();
          
          if (progressIntervalIdRef.current) clearInterval(progressIntervalIdRef.current); // Clear any existing interval
          progressIntervalIdRef.current = setInterval(() => {
            const currentVideoRef = videoRef.current; 
            const currentRecorder = mediaRecorderInstanceRef.current;

            if (!currentVideoRef || !currentRecorder) {
              if (progressIntervalIdRef.current) {
                clearInterval(progressIntervalIdRef.current);
                progressIntervalIdRef.current = null;
              }
              return;
            }
            
            // Check if recorder is in a valid recording state
            if (currentRecorder.state === 'inactive' || currentRecorder.state === 'paused') {
                console.warn(`useVideoTrimmer: Interval fired but recorder not in 'recording' state (state: ${currentRecorder.state}). Clearing interval.`);
                if (progressIntervalIdRef.current) {
                  clearInterval(progressIntervalIdRef.current);
                  progressIntervalIdRef.current = null;
                }
                // Optionally stop recorder if it's in an unexpected state but not inactive
                if (currentRecorder.state !== 'inactive' && currentRecorder.state !== 'paused') currentRecorder.stop();
                return;
            }

            ctx.drawImage(currentVideoRef, 0, 0, canvas.width, canvas.height);
            
            const elapsed = (Date.now() - frameCaptureStartTime) / 1000;
            const progress = Math.min((elapsed / calculatedTrimDuration) * 100, 100);
            setTrimProgress(progress);
            
            if (currentVideoRef.currentTime >= endTime || elapsed >= calculatedTrimDuration + 0.1 ) { // Added a small buffer to ensure last frame
              if (progressIntervalIdRef.current) {
                clearInterval(progressIntervalIdRef.current);
                progressIntervalIdRef.current = null;
              }
              
              currentVideoRef.pause();
              if (currentRecorder.state === 'recording') { // This check is fine as state is confirmed 'recording' above
                currentRecorder.stop();
              }
              console.log('useVideoTrimmer: Trimming duration reached or passed. Elapsed:', elapsed, "CurrentTime:", currentVideoRef.currentTime);
            }
          }, Math.floor(1000 / 30)) as unknown as number; 

        } catch (playError) {
          console.error('useVideoTrimmer: Error starting playback after seek:', playError);
          setError('Failed to start video playback for trimming.');
          if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state === 'recording') {
            mediaRecorderInstanceRef.current.stop();
          }
          setIsTrimming(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      // Safety timeout for seek operation
      seekTimeoutId = setTimeout(() => {
        video.onseeked = originalOnSeeked; // Restore original onseeked
        if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state === 'recording') {
            console.error('useVideoTrimmer: Seek operation timed out. Aborting trim.');
            setError('Video seeking failed or timed out. Cannot trim.');
            if (mediaRecorderInstanceRef.current.state === 'recording') { // Check again before stopping
                 mediaRecorderInstanceRef.current.stop();
            }
            setIsTrimming(false);
            stream.getTracks().forEach(track => track.stop());
        }
      }, 5000) as unknown as number;

    } catch (trimError) {
      console.error('useVideoTrimmer: Error in trimVideo function:', trimError);
      setError('Failed to trim video due to an unexpected error. Please try again.');
      setIsTrimming(false);
      setTrimProgress(0);
      if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state === 'recording') {
        mediaRecorderInstanceRef.current.stop();
      }
       if (progressIntervalIdRef.current) {
          clearInterval(progressIntervalIdRef.current);
          progressIntervalIdRef.current = null;
        }
    }
  }, [isLoaded, duration, startTime, endTime, videoBlob, onTrimComplete]);

  const cancelTrimming = useCallback(() => {
    console.log('useVideoTrimmer: cancelTrimming called.');
    if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state !== 'inactive') {
      const recorder = mediaRecorderInstanceRef.current;
      recorder.onstop = null; 
      recorder.ondataavailable = null;
      recorder.onerror = null;
      
      if (recorder.state === 'recording') { // Only stop if recording
        recorder.stop();
      }
      console.log('useVideoTrimmer: MediaRecorder operations halted by cancelTrimming.');
    }
    mediaRecorderInstanceRef.current = null; // Ensure it's nulled

    if (progressIntervalIdRef.current) {
      clearInterval(progressIntervalIdRef.current);
      progressIntervalIdRef.current = null;
      console.log('useVideoTrimmer: Progress interval cleared by cancelTrimming.');
    }
    
    if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
    }

    setIsTrimming(false);
    setTrimProgress(0);
    // Don't clear error on cancel, user might want to see it.
    // setError('');
    console.log('useVideoTrimmer: Video trimming process cancelled by user action.');
  }, []);

  const retryTrimming = useCallback(() => {
    console.log('useVideoTrimmer: Retrying trimming.');
    setError('');
    setTrimProgress(0);
    setIsTrimming(false); 
    // Ensure any previous instances are fully stopped/cleaned up
    if (mediaRecorderInstanceRef.current || progressIntervalIdRef.current) {
        cancelTrimming(); // Use cancelTrimming for proper cleanup
    }
    // Slight delay to ensure cleanup completes before restarting
    setTimeout(() => {
      trimVideo();
    }, 100);
  }, [trimVideo, cancelTrimming]);

  const trimmedDuration = (isLoaded && duration > 0) ? Math.max(0, endTime - startTime) : 0;

  return {
    videoRef,
    videoUrl: videoUrlRef.current, // Pass the actual URL string
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
    setIsPlaying, // Expose if needed by parent for direct manipulation (e.g., on seek)
    setCurrentTime, // Expose if needed
  };
};
