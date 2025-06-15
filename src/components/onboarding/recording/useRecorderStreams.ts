
import { useCallback } from "react";

export type RecordingMode = 'camera' | 'screen' | 'both';
export type CameraFacing = 'front' | 'back';

interface UseRecorderStreamsParams {
  recordingMode: RecordingMode;
  cameraFacing: CameraFacing;
  isMobile: boolean;
  setShowRotateOverlay: (v: boolean) => void;
}

// getUserMedia for camera stream
export const useGetCameraStream = ({
  cameraFacing,
  isMobile,
  setShowRotateOverlay,
}: Pick<UseRecorderStreamsParams, "cameraFacing" | "isMobile" | "setShowRotateOverlay">) => {
  return useCallback(async () => {
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
        throw new Error("Rotate device");
      }
    }
    return mediaStream;
  }, [cameraFacing, isMobile, setShowRotateOverlay]);
};

// getDisplayMedia for screen stream
export const useGetScreenStream = () => {
  return useCallback(async () => {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: true
    });
    return displayStream;
  }, []);
};
