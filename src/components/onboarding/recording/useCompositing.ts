
import { useRef, useCallback } from "react";

export interface UseCompositingArgs {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  pipVideoRef: React.RefObject<HTMLVideoElement>;
}

export function useCompositingLoop(canvasRef: React.RefObject<HTMLCanvasElement>, pipVideoRef: React.RefObject<HTMLVideoElement>) {
  const requestRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  // Starts compositing: draws frame on canvas from streams, runs in loop
  const startCompositing = useCallback(
    async (displayStream: MediaStream, cameraStream: MediaStream) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 1920;
      canvas.height = 1080;

      // Create hidden video elements for frame extraction
      const screenVideo = document.createElement('video');
      const cameraVideo = document.createElement('video');
      screenVideo.srcObject = displayStream;
      cameraVideo.srcObject = cameraStream;
      screenVideo.muted = true;
      cameraVideo.muted = true;

      // Play videos and ensure they are ready
      await Promise.all([
        new Promise((resolve) => { screenVideo.onloadedmetadata = resolve; screenVideo.play(); }),
        new Promise((resolve) => { cameraVideo.onloadedmetadata = resolve; cameraVideo.play(); })
      ]);

      if (pipVideoRef.current) pipVideoRef.current.srcObject = cameraStream;

      activeRef.current = true;
      // The draw loop
      const drawFrame = () => {
        if (!activeRef.current) return;
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        // PiP
        ctx.drawImage(
          cameraVideo,
          canvas.width - 320 - 20,
          canvas.height - 240 - 20,
          320,
          240
        );
        requestRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();
    },
    [canvasRef, pipVideoRef]
  );

  const stopCompositing = useCallback(() => {
    activeRef.current = false;
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
  }, [pipVideoRef]);

  return { startCompositing, stopCompositing };
}
