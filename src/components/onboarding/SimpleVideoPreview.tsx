
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SimpleVideoPreviewProps {
  videoBlob: Blob;
  onReRecord?: () => void;
}

const SimpleVideoPreview: React.FC<SimpleVideoPreviewProps> = ({ 
  videoBlob, 
  onReRecord 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    console.log('[SimpleVideoPreview] Setting up blob:', videoBlob.size, 'bytes');
    
    // Create URL immediately
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);
    
    // Clean up on unmount
    return () => {
      console.log('[SimpleVideoPreview] Cleaning up URL');
      URL.revokeObjectURL(url);
    };
  }, [videoBlob]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      console.log('[SimpleVideoPreview] Setting video src:', videoUrl);
      const video = videoRef.current;
      
      // Set src directly
      video.src = videoUrl;
      
      // Force load
      video.load();
      
      // Add event listeners
      const handleLoadedData = () => {
        console.log('[SimpleVideoPreview] Video loaded and ready to play');
      };
      
      const handleError = (e: Event) => {
        console.error('[SimpleVideoPreview] Video error:', e);
      };
      
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };
    }
  }, [videoUrl]);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('[SimpleVideoPreview] Play error:', error);
    }
  };

  const handleVideoPlay = () => {
    console.log('[SimpleVideoPreview] Video started playing');
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    console.log('[SimpleVideoPreview] Video paused');
    setIsPlaying(false);
  };

  const handleVideoEnded = () => {
    console.log('[SimpleVideoPreview] Video ended');
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
        <Play className="h-5 w-5" />
        Video Preview
      </h3>
      
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls={false}
          preload="metadata"
          playsInline
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
        />
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={handlePlayPause}
          size="lg"
          variant="outline"
          className="px-6"
        >
          {isPlaying ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Play
            </>
          )}
        </Button>
        
        {onReRecord && (
          <Button
            onClick={onReRecord}
            size="lg"
            variant="outline"
            className="px-6"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Re-record
          </Button>
        )}
      </div>
    </div>
  );
};

export default SimpleVideoPreview;
