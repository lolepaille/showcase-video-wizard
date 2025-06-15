
import { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SubmissionData } from '@/pages/Index';
import { useGetCameraStream, useGetScreenStream, RecordingMode, CameraFacing } from './useRecorderStreams';
import { useCompositingLoop } from './useCompositing';
import { useRecordingTimer } from './useRecordingTimer';

interface UseRecordingProps {
  updateData: (data: Partial<SubmissionData>) => void;
  data: SubmissionData;
}

export const useRecording = ({ updateData, data }: UseRecordingProps) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(data.videoBlob || null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('front');
  const isMobile = useIsMobile();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Recording chunks & state
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Timer hook
  const { time: recordingTime, start: startTimer, stop: stopTimer, reset: resetTimer } = useRecordingTimer(() => stopRecording());

  // Stream helpers
  const getCameraStream = useGetCameraStream({ cameraFacing, isMobile, setShowRotateOverlay });
  const getScreenStream = useGetScreenStream();

  // Compositing
  const { startCompositing, stopCompositing } = useCompositingLoop(canvasRef, pipVideoRef);

  // Helper: process & save recorded blob/file
  const processRecordedBlob = useCallback((blob: Blob) => {
    setRecordedBlob(blob);
    const videoFile = new File([blob], "video.webm", { type: blob.type });
    updateData({ videoBlob: videoFile });
  }, [updateData]);

  // Handle stop
  const mediaRecorderOnStop = useCallback(() => {
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      processRecordedBlob(blob);
      if (videoRef.current) videoRef.current.srcObject = null;
      if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
    }
  }, [processRecordedBlob]);

  // Stop recording flow
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopTimer();
    stopCompositing();
    [cameraStream, screenStream].forEach(stream => stream && stream.getTracks().forEach(track => track.stop()));
    setCameraStream(null);
    setScreenStream(null);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  }, [cameraStream, screenStream, stopTimer, stopCompositing]);

  // Start recording flow
  const startRecording = useCallback(async () => {
    setError('');
    setShowRotateOverlay(false);

    let finalStream: MediaStream | null = null;
    let localCameraStream: MediaStream | null = null;
    let localScreenStream: MediaStream | null = null;

    try {
      if (recordingMode === 'camera') {
        localCameraStream = await getCameraStream();
        setCameraStream(localCameraStream);
        finalStream = localCameraStream;
        if (videoRef.current) videoRef.current.srcObject = localCameraStream;
      } else if (recordingMode === 'screen') {
        localScreenStream = await getScreenStream();
        setScreenStream(localScreenStream);
        finalStream = localScreenStream;
        if (videoRef.current) videoRef.current.srcObject = localScreenStream;
      } else if (recordingMode === 'both') {
        localScreenStream = await getScreenStream();
        localCameraStream = await getCameraStream();
        setScreenStream(localScreenStream);
        setCameraStream(localCameraStream);

        // Start compositing PiP/canvas
        await startCompositing(localScreenStream, localCameraStream);
        finalStream = canvasRef.current!.captureStream(30);

        // Add all audio
        [...localScreenStream.getAudioTracks(), ...localCameraStream.getAudioTracks()].forEach(track => {
          finalStream!.addTrack(track);
        });
        if (videoRef.current) videoRef.current.srcObject = localScreenStream;
      }

      if (!finalStream) return;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const rec = new MediaRecorder(finalStream, { mimeType });
      mediaRecorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      rec.onstop = mediaRecorderOnStop;
      rec.start(1000);

      setIsRecording(true);
      resetTimer();
      startTimer();
    } catch (err) {
      setError('Could not access camera and/or screen. Please check your permissions.');
      [localCameraStream, localScreenStream].forEach(stream => stream && stream.getTracks().forEach(track => track.stop()));
    }
  }, [recordingMode, getCameraStream, getScreenStream, startCompositing, startTimer, resetTimer, mediaRecorderOnStop]);

  // Reset
  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    resetTimer();
    updateData({ videoBlob: undefined });
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }
    if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
    stopCompositing();
  }, [resetTimer, updateData, stopCompositing]);

  // Play preview
  const playPreview = useCallback(() => {
    videoRef.current?.play();
  }, []);

  return {
    isRecording,
    recordedBlob,
    recordingTime,
    recordingMode,
    cameraStream,
    screenStream,
    error,
    showRotateOverlay,
    cameraFacing,
    videoRef,
    pipVideoRef,
    canvasRef,
    startRecording,
    stopRecording,
    resetRecording,
    playPreview,
    setRecordingMode,
    setCameraFacing,
    setShowRotateOverlay
  };
};
