import { useState, useRef, useEffect, useCallback } from 'react';

interface UseVideoTrimmerProps {
  videoBlob?: Blob;
  videoUrl?: string;
  onTrimComplete: (trimmedBlob: Blob) => void;
}

export const useVideoTrimmer = ({ videoBlob, videoUrl, onTrimComplete }: UseVideoTrimmerProps) => {
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
  const videoUrlRef = useRef<string>('');
  const mediaRecorderInstanceRef = useRef<MediaRecorder | null>(null);
  const progressIntervalIdRef = useRef<number | null>(null);
  const sourceBlobRef = useRef<Blob | null>(null);
  const metadataLoadAttemptRef = useRef<number>(0);

  useEffect(() => {
    // Clean up any previous URL
    if (videoUrlRef.current && sourceBlobRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = '';
    }
    
    // Create URL from blob or use provided URL
    if (videoBlob) {
      sourceBlobRef.current = videoBlob;
      videoUrlRef.current = URL.createObjectURL(videoBlob);
      console.log('useVideoTrimmer: New video URL created from blob:', videoUrlRef.current);
    } else if (videoUrl) {
      sourceBlobRef.current = null;
      videoUrlRef.current = videoUrl;
      console.log('useVideoTrimmer: Using provided video URL:', videoUrlRef.current);
    } else {
      setError('No video source provided');
      return;
    }
    
    // Reset state
    setIsLoaded(false);
    setCurrentTime(0);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setIsPlaying(false);
    setError('');
    metadataLoadAttemptRef.current = 0;

    // Force reload of video if src is already set to ensure metadata is re-read
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Add additional video attributes for better compatibility
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      if (video.src === videoUrlRef.current) {
        video.load(); 
      }
      
      // Set up a timeout for metadata loading
      const metadataTimeout = setTimeout(() => {
        if (!isLoaded && metadataLoadAttemptRef.current < 3) {
          console.warn('useVideoTrimmer: Metadata loading timeout, retrying...');
          metadataLoadAttemptRef.current++;
          video.load();
        } else if (!isLoaded) {
          setError('Failed to load video metadata after multiple attempts. The video file may be corrupted or in an unsupported format.');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(metadataTimeout);
    }

    return () => {
      if (videoUrlRef.current && videoBlob) { // Only revoke if we created the URL
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
  }, [videoBlob, videoUrl, isLoaded]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      console.log('useVideoTrimmer: Raw duration received:', dur);
      
      // More robust duration validation
      if (isFinite(dur) && dur > 0 && dur !== Infinity) {
        setDuration(dur);
        setEndTime(dur);
        setStartTime(0);
        setIsLoaded(true);
        setError('');
        metadataLoadAttemptRef.current = 0;
        console.log('useVideoTrimmer: Video loaded successfully, duration:', dur);
      } else {
        console.error('useVideoTrimmer: Invalid duration detected:', dur);
        
        // Try to get duration through other means
        const video = videoRef.current;
        
        // Attempt to seek to end to determine duration
        const originalTime = video.currentTime;
        
        const seekToEnd = () => {
          try {
            video.currentTime = Number.MAX_SAFE_INTEGER;
            
            const checkDuration = () => {
              const newDur = video.duration;
              const currentPos = video.currentTime;
              
              if (isFinite(newDur) && newDur > 0 && newDur !== Infinity) {
                setDuration(newDur);
                setEndTime(newDur);
                setStartTime(0);
                setIsLoaded(true);
                setError('');
                video.currentTime = originalTime;
                console.log('useVideoTrimmer: Duration determined through seeking:', newDur);
              } else if (currentPos > 0 && isFinite(currentPos)) {
                // Use current position as approximate duration
                setDuration(currentPos);
                setEndTime(currentPos);
                setStartTime(0);
                setIsLoaded(true);
                setError('');
                video.currentTime = originalTime;
                console.log('useVideoTrimmer: Using seek position as duration:', currentPos);
              } else {
                video.currentTime = originalTime;
                setError(`Unable to determine video duration. The video file may be corrupted, incomplete, or in an unsupported format. Please try re-uploading the video.`);
                setIsLoaded(false);
              }
            };
            
            video.addEventListener('seeked', checkDuration, { once: true });
            
            // Fallback if seeked event doesn't fire
            setTimeout(() => {
              video.removeEventListener('seeked', checkDuration);
              checkDuration();
            }, 2000);
            
          } catch (seekError) {
            console.error('useVideoTrimmer: Error during seek attempt:', seekError);
            setError(`Failed to load video metadata. Please ensure the video file is not corrupted and try again.`);
            setIsLoaded(false);
          }
        };
        
        // Only attempt seeking if we haven't tried too many times
        if (metadataLoadAttemptRef.current < 2) {
          metadataLoadAttemptRef.current++;
          setTimeout(seekToEnd, 1000);
        } else {
          setError(`Failed to load video metadata after multiple attempts. The video duration could not be determined. Please try re-uploading the video or use a different format.`);
          setIsLoaded(false);
        }
      }
    }
  }, []);

  const handleVideoError = useCallback((event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = event.currentTarget;
    let errorMsg = 'An unknown video error occurred.';
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case videoElement.error.MEDIA_ERR_ABORTED: 
          errorMsg = 'Video loading was aborted. Please try again.'; 
          break;
        case videoElement.error.MEDIA_ERR_NETWORK: 
          errorMsg = 'A network error occurred while loading the video. Please check your connection and try again.'; 
          break;
        case videoElement.error.MEDIA_ERR_DECODE: 
          errorMsg = 'The video file is corrupted or uses an unsupported codec. Please try re-uploading the video.'; 
          break;
        case videoElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED: 
          errorMsg = 'The video format is not supported by your browser. Please try uploading a different video format.'; 
          break;
        default: 
          errorMsg = `Video error (code: ${videoElement.error.code}). Please try again.`;
      }
    }
    console.error('useVideoTrimmer: Video element error:', errorMsg, videoElement.error);
    setError(errorMsg);
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
        if (isPlaying && time >= endTime) {
          videoRef.current.pause();
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
      setCurrentTime(validatedStart);
    }
  }, [endTime]);

  const handleEndTimeChange = useCallback((value: number[]) => {
    const newEnd = Math.max(value[0], startTime + 0.1);
    const validatedEnd = Math.min(duration, newEnd);
    setEndTime(validatedEnd);
    
    if (videoRef.current && videoRef.current.currentTime > validatedEnd) {
      videoRef.current.currentTime = validatedEnd;
      setCurrentTime(validatedEnd);
    }
  }, [startTime, duration]);

  const handleCurrentTimeChange = useCallback((value: number[]) => {
    if (videoRef.current && isLoaded) {
      const time = Math.max(0, Math.min(value[0], duration)); 
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [isLoaded, duration]);

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
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('useVideoTrimmer: Video dimensions are zero. videoWidth:', video.videoWidth, 'videoHeight:', video.videoHeight);
        setError('Video dimensions are invalid (zero width or height). Cannot trim.');
        setIsTrimming(false);
        return;
      }
      console.log('useVideoTrimmer: Canvas dimensions for trimming:', canvas.width, 'x', canvas.height);
      
      const stream = canvas.captureStream(30);
      
      try {
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
        } else if (sourceBlobRef.current && sourceBlobRef.current.type.startsWith('video/')) {
            console.warn('useVideoTrimmer: Video element stream has no audio tracks. Trimmed video might be silent if browser does not mix it.');
        }
      } catch (audioError) {
        console.warn('useVideoTrimmer: Could not add audio track to trimmed video:', audioError);
      }
      
      let mimeTypeToUse = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeTypeToUse)) mimeTypeToUse = 'video/webm;codecs=vp8';
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
        stream.getTracks().forEach(track => track.stop());
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
        stream.getTracks().forEach(track => track.stop());
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
        seekTimeoutId = null;

        console.log('useVideoTrimmer: Video seeked to startTime.');
        try {
          const originalMuted = video.muted;
          video.muted = true; 
          await video.play();
          video.muted = originalMuted;

          console.log('useVideoTrimmer: Video playback started for frame capture.');
          
          let frameCaptureStartTime = Date.now();
          
          if (progressIntervalIdRef.current) clearInterval(progressIntervalIdRef.current);
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
            
            if (currentRecorder.state === 'inactive' || currentRecorder.state === 'paused') {
                console.warn(`useVideoTrimmer: Interval fired but recorder not in 'recording' state (state: ${currentRecorder.state}). Clearing interval.`);
                if (progressIntervalIdRef.current) {
                  clearInterval(progressIntervalIdRef.current);
                  progressIntervalIdRef.current = null;
                }
                if (currentRecorder.state !== 'inactive' && currentRecorder.state !== 'paused') currentRecorder.stop();
                return;
            }

            ctx.drawImage(currentVideoRef, 0, 0, canvas.width, canvas.height);
            
            const elapsed = (Date.now() - frameCaptureStartTime) / 1000;
            const progress = Math.min((elapsed / calculatedTrimDuration) * 100, 100);
            setTrimProgress(progress);
            
            if (currentVideoRef.currentTime >= endTime || elapsed >= calculatedTrimDuration + 0.1 ) {
              if (progressIntervalIdRef.current) {
                clearInterval(progressIntervalIdRef.current);
                progressIntervalIdRef.current = null;
              }
              
              currentVideoRef.pause();
              if (currentRecorder.state === 'recording') {
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
      
      seekTimeoutId = setTimeout(() => {
        video.onseeked = originalOnSeeked;
        if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state === 'recording') {
            console.error('useVideoTrimmer: Seek operation timed out. Aborting trim.');
            setError('Video seeking failed or timed out. Cannot trim.');
            if (mediaRecorderInstanceRef.current.state === 'recording') {
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
  }, [isLoaded, duration, startTime, endTime, onTrimComplete]);

  const cancelTrimming = useCallback(() => {
    console.log('useVideoTrimmer: cancelTrimming called.');
    if (mediaRecorderInstanceRef.current && mediaRecorderInstanceRef.current.state !== 'inactive') {
      const recorder = mediaRecorderInstanceRef.current;
      recorder.onstop = null; 
      recorder.ondataavailable = null;
      recorder.onerror = null;
      
      if (recorder.state === 'recording') {
        recorder.stop();
      }
      console.log('useVideoTrimmer: MediaRecorder operations halted by cancelTrimming.');
    }
    mediaRecorderInstanceRef.current = null;

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
    console.log('useVideoTrimmer: Video trimming process cancelled by user action.');
  }, []);

  const retryTrimming = useCallback(() => {
    console.log('useVideoTrimmer: Retrying trimming.');
    setError('');
    setTrimProgress(0);
    setIsTrimming(false); 
    if (mediaRecorderInstanceRef.current || progressIntervalIdRef.current) {
        cancelTrimming();
    }
    setTimeout(() => {
      trimVideo();
    }, 100);
  }, [trimVideo, cancelTrimming]);

  const trimmedDuration = (isLoaded && duration > 0) ? Math.max(0, endTime - startTime) : 0;

  return {
    videoRef,
    videoUrl: videoUrlRef.current,
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
    setIsPlaying,
    setCurrentTime
  };
};
