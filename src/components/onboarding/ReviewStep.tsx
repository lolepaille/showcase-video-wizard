import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Upload, AlertCircle, Play, Pause, Clock, Replace } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SubmissionForm from './SubmissionForm';
import type { SubmissionData, ClusterType } from '@/pages/Index';

interface QualityChecked {
  audioVisual: boolean;
  questionsAddressed: boolean;
  timeLimit: boolean;
}

interface ReviewStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qualityChecked, setQualityChecked] = useState<QualityChecked>({
    audioVisual: false,
    questionsAddressed: false,
    timeLimit: false,
  });
  const { toast } = useToast();

  const handleContactChange = (field: string, value: string | ClusterType) => {
    updateData({ [field]: value });
  };

  const handleQualityCheck = (key: keyof QualityChecked, checked: boolean) => {
    setQualityChecked(prev => ({ ...prev, [key]: checked }));
  };

  const canSubmit = () => {
    const hasRequiredFields = data.fullName && data.email && data.cluster;
    const hasAllChecks = Object.values(qualityChecked).every(Boolean);
    return hasRequiredFields && hasAllChecks;
  };

  const uploadViaFunction = async (file: File, endpoint: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log(`Uploading file via API: ${endpoint}`);

      const res = await fetch(
        `https://mzprzuwbpknbzgtbmzix.supabase.co/functions/v1/${endpoint}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();
      if (!res.ok || !result.url) {
        throw new Error(result.error || "Failed to upload file");
      }
      console.log(`Upload successful. Public URL: ${result.url}`);
      return result.url;
    } catch (error) {
      console.error(`Failed to upload via API:`, error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast({
        title: "Incomplete submission",
        description: "Please fill in all required fields and complete the quality checklist.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Starting submission process with data:', {
      fullName: data.fullName,
      email: data.email,
      cluster: data.cluster,
      hasProfilePicture: !!data.profilePicture,
      hasVideo: !!data.videoBlob
    });

    try {
      let profilePictureUrl = null;
      let videoUrl = null;

      if (data.profilePicture) {
        console.log('Uploading profile picture...');
        profilePictureUrl = await uploadViaFunction(
          data.profilePicture,
          'upload-profile-picture'
        );
      }

      if (data.videoBlob) {
        console.log('Uploading video blob...');
        const videoFile = new File([data.videoBlob], 'video.webm', { type: 'video/webm' });
        videoUrl = await uploadViaFunction(videoFile, 'upload-video');
      }

      const submissionData = {
        full_name: data.fullName,
        email: data.email,
        title: data.title || null,
        cluster: data.cluster as ClusterType,
        profile_picture_url: profilePictureUrl,
        video_url: videoUrl,
        notes: data.notes,
        is_published: false
      };

      console.log('Inserting submission data:', submissionData);

      const { data: insertedData, error: insertError } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log('Submission successful:', insertedData);

      toast({
        title: "Success!",
        description: "Your submission has been received successfully.",
      });

      onNext();
    } catch (error) {
      console.error('Submission error:', error);

      let errorMessage = "Failed to submit. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Custom Video Player State ----
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useRef<string>('');

  // Setup video blob on mount/change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
    if (data.videoBlob) {
      // Clean up previous URL
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
      videoUrl.current = URL.createObjectURL(data.videoBlob);
      if (videoRef.current) {
        videoRef.current.src = videoUrl.current;
      }
    }
    return () => {
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
    };
    // eslint-disable-next-line
  }, [data.videoBlob]);

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      // Only set if safe and finite!
      const dur = videoRef.current.duration;
      setDuration(Number.isFinite(dur) ? dur : 0);
      setIsLoaded(Number.isFinite(dur) && dur > 0);
      setCurrentTime(0);
    }
  };
  const onTimeUpdate = () => {
    if (videoRef.current) {
      const cTime = videoRef.current.currentTime;
      setCurrentTime(Number.isFinite(cTime) ? cTime : 0);
      if (Number.isFinite(duration) && cTime >= duration && duration > 0) {
        setIsPlaying(false);
      }
    }
  };
  const handlePlayPause = () => {
    if (!isLoaded || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };
  const handleSliderChange = (v: number[]) => {
    if (videoRef.current && isLoaded) {
      const sliderVal = Array.isArray(v) && Number.isFinite(v[0]) ? v[0] : 0;
      if (Number.isFinite(sliderVal) && sliderVal >= 0 && sliderVal <= duration) {
        videoRef.current.currentTime = sliderVal;
        setCurrentTime(sliderVal);
      }
    }
  };
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleReplaceVideo = () => {
    updateData({ videoBlob: undefined });
    onPrev();
  };

  // ---- Start render ----

  return (
    <div className="space-y-8">
      <SubmissionForm
        data={data}
        qualityChecked={qualityChecked}
        onContactChange={handleContactChange}
        onQualityCheck={handleQualityCheck}
        hideVideoPreview={true}
      >
        {/* Video Preview section: show only if videoBlob exists */}
        {data.videoBlob && (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
                <Play className="h-5 w-5" />
                Video Preview
                {isLoaded && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground ml-3">
                    <Clock className="h-4 w-4" />
                    {formatTime(duration)}
                  </span>
                )}
              </h3>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  preload="metadata"
                  controls={false}
                  onLoadedMetadata={onLoadedMetadata}
                  onTimeUpdate={onTimeUpdate}
                  onPlay={onPlay}
                  onPause={onPause}
                  onEnded={onPause}
                  onError={(e) => { setIsLoaded(false); setIsPlaying(false); }}
                  tabIndex={0}
                  aria-label="Video preview"
                  poster=""
                />
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Loading video...</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Controls row */}
              <div className="flex flex-col items-center gap-3 mt-2 max-w-2xl mx-auto px-2">
                {/* Slider */}
                <div className="w-full flex items-center gap-3 justify-center max-w-xl">
                  <span className="text-muted-foreground text-sm min-w-[45px] text-center">
                    {formatTime(currentTime)}
                  </span>
                  <Slider
                    min={0}
                    max={duration > 0 ? duration : 1}
                    step={0.05}
                    value={[Math.min(Math.max(currentTime, 0), duration > 0 ? duration : 1)]}
                    onValueChange={handleSliderChange}
                    disabled={!isLoaded || !(duration > 0)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-sm min-w-[45px] text-center">
                    {formatTime(duration)}
                  </span>
                </div>
                {/* Play/Pause + Replace, centered */}
                <div className="flex justify-center items-center gap-3 w-full mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayPause}
                    disabled={!isLoaded}
                    className="flex items-center gap-2"
                    type="button"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleReplaceVideo}
                    type="button"
                  >
                    <Replace className="h-4 w-4" />
                    Replace Video
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SubmissionForm>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrev} disabled={isSubmitting}>
          Previous
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit
            </>
          )}
        </Button>
      </div>

      {!canSubmit() && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Complete your submission</h4>
              <p className="text-sm text-amber-700 mt-1">
                Please ensure all required fields are filled and all quality checks are completed before submitting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewStep;

// NOTE: src/components/onboarding/ReviewStep.tsx is long. Consider asking me to refactor!
