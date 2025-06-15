
import { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SubmissionData } from '@/pages/Index';

type RecordingMode = 'camera' | 'screen' | 'both';
type CameraFacing = 'front' | 'back';

interface UseRecordingProps {
  updateData: (data: Partial<SubmissionData>) => void;
  data: SubmissionData;
}

export const useRecording = ({ updateData, data }: UseRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(data.videoBlob || null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('front');
  const isMobile = useIsMobile();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Stop all streams
      [cameraStream, screenStream].forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
      
      setCameraStream(null);
      setScreenStream(null);
    }
  }, [isRecording, cameraStream, screenStream]);

  const startRecording = useCallback(async () => {
    try {
      console.log('[Recording] Starting recording with mode:', recordingMode, 'cameraFacing:', cameraFacing);
      setError('');
      setShowRotateOverlay(false);
      let finalStream: MediaStream | null = null;

      if (recordingMode === 'camera') {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: cameraFacing === 'front' ? 'user' : { exact: 'environment' }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        const videoTrack = mediaStream.getVideoTracks()[0];
        if (isMobile && videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.width && settings.height && settings.height > settings.width) {
            setShowRotateOverlay(true);
            mediaStream.getTracks().forEach(track => track.stop());
            return;
          }
        }
        
        setCameraStream(mediaStream);
        finalStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } else if (recordingMode === 'screen') {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        });
        
        setScreenStream(displayStream);
        finalStream = displayStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = displayStream;
        }
      } else if (recordingMode === 'both') {
        const [displayStream, cameraStreamLocal] = await Promise.all([
          navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: true
          }),
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 320 },
              height: { ideal: 240 },
              facingMode: cameraFacing === 'front' ? 'user' : { exact: 'environment' }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          })
        ]);

        const cameraVideoTrack = cameraStreamLocal.getVideoTracks()[0];
        if (isMobile && cameraVideoTrack) {
          const settings = cameraVideoTrack.getSettings();
          if (settings.width && settings.height && settings.height > settings.width) {
            setShowRotateOverlay(true);
            displayStream.getTracks().forEach(track => track.stop());
            cameraStreamLocal.getTracks().forEach(track => track.stop());
            return;
          }
        }

        setScreenStream(displayStream);
        setCameraStream(cameraStreamLocal);

        // Set up canvas for compositing
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.width = 1920;
        canvas.height = 1080;

        // Create video elements for compositing
        const screenVideo = document.createElement('video');
        const cameraVideo = document.createElement('video');
        
        screenVideo.srcObject = displayStream;
        cameraVideo.srcObject = cameraStreamLocal;
        
        await Promise.all([
          new Promise(resolve => { screenVideo.onloadedmetadata = resolve; screenVideo.play(); }),
          new Promise(resolve => { cameraVideo.onloadedmetadata = resolve; cameraVideo.play(); })
        ]);

        // Set up PiP preview
        if (videoRef.current) {
          videoRef.current.srcObject = displayStream;
        }
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = cameraStreamLocal;
        }

        // Composite the streams
        const drawFrame = () => {
          // Draw screen capture
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          
          // Draw camera in corner (320x240 at bottom-right with 20px margin)
          const pipWidth = 320;
          const pipHeight = 240;
          const margin = 20;
          
          ctx.drawImage(
            cameraVideo,
            canvas.width - pipWidth - margin,
            canvas.height - pipHeight - margin,
            pipWidth,
            pipHeight
          );
          
          if (isRecording) {
            animationRef.current = requestAnimationFrame(drawFrame);
          }
        };
        
        drawFrame();
        finalStream = canvas.captureStream(30);
        
        // Add audio from both streams
        const audioTracks = [
          ...displayStream.getAudioTracks(),
          ...cameraStreamLocal.getAudioTracks()
        ];
        audioTracks.forEach(track => finalStream!.addTrack(track));
      }

      if (!finalStream) {
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(finalStream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        updateData({ videoBlob: blob });
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
        }
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) { // 2 minutes max
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('[Recording] Error starting recording:', err);
      setError('Could not access camera and/or screen. Please check your permissions.');
    }
  }, [updateData, recordingMode, isMobile, cameraFacing, stopRecording]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    updateData({ videoBlob: undefined });
    
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = null;
    }
  }, [updateData]);

  const playPreview = useCallback(() => {
    videoRef.current?.play();
  }, []);

  return {
    // State
    isRecording,
    recordedBlob,
    recordingTime,
    recordingMode,
    cameraStream,
    screenStream,
    error,
    showRotateOverlay,
    cameraFacing,
    // Refs
    videoRef,
    pipVideoRef,
    canvasRef,
    // Actions
    startRecording,
    stopRecording,
    resetRecording,
    playPreview,
    setRecordingMode,
    setCameraFacing,
    setShowRotateOverlay
  };
};
