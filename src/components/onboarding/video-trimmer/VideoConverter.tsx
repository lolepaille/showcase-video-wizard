
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface VideoConverterProps {
  videoUrl: string;
  onConversionComplete: (convertedBlob: Blob) => void;
  onCancel: () => void;
  title?: string;
}

const VideoConverter: React.FC<VideoConverterProps> = ({
  videoUrl,
  onConversionComplete,
  onCancel,
  title = "Converting Video"
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const convertVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsConverting(true);
    setProgress(0);
    setError('');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Wait for video to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        video.load();
      });

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const stream = canvas.captureStream(30);
      
      // Add audio if available
      try {
        const videoStream = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
        if (videoStream) {
          const audioTracks = videoStream.getAudioTracks();
          audioTracks.forEach((track: MediaStreamTrack) => stream.addTrack(track));
        }
      } catch (audioError) {
        console.warn('Could not capture audio:', audioError);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const convertedBlob = new Blob(chunks, { type: 'video/webm' });
        onConversionComplete(convertedBlob);
        setIsConverting(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Failed to convert video format');
        setIsConverting(false);
      };

      mediaRecorder.start();
      video.currentTime = 0;
      await video.play();

      const duration = video.duration;
      const updateProgress = () => {
        if (video.currentTime < duration && isConverting) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setProgress((video.currentTime / duration) * 100);
          requestAnimationFrame(updateProgress);
        } else {
          mediaRecorder.stop();
          video.pause();
          stream.getTracks().forEach(track => track.stop());
        }
      };

      updateProgress();

    } catch (conversionError) {
      console.error('Video conversion error:', conversionError);
      setError('Failed to convert video. Please try a different video or format.');
      setIsConverting(false);
    }
  };

  const handleRetry = () => {
    setError('');
    convertVideo();
  };

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <RefreshCw className={`h-5 w-5 ${isConverting ? 'animate-spin' : ''}`} />
          {title}
        </CardTitle>
        <p className="text-muted-foreground">
          Converting video to a compatible format for trimming
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2 text-red-600 border-red-300"
            >
              Retry Conversion
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full max-w-md mx-auto rounded-lg"
            crossOrigin="anonymous"
            muted
            playsInline
            style={{ display: 'none' }}
          />
          
          <canvas
            ref={canvasRef}
            className="w-full max-w-md mx-auto rounded-lg bg-black"
            style={{ display: isConverting ? 'block' : 'none' }}
          />

          {!isConverting && !error && (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Ready to convert video to a browser-compatible format
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={convertVideo}>
                  Start Conversion
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isConverting && (
            <div className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Converting: {Math.round(progress)}%
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setIsConverting(false);
                  onCancel();
                }}
                className="mt-4"
              >
                Cancel Conversion
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoConverter;
