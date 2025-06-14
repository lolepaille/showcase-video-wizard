
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Upload, AlertCircle } from 'lucide-react';
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

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      console.log(`Uploading file to bucket: ${bucket}, path: ${path}`);
      
      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`Upload error for ${bucket}:`, error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log(`Upload successful, public URL: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error(`Failed to upload to ${bucket}:`, error);
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

      // Upload profile picture if provided
      if (data.profilePicture) {
        console.log('Uploading profile picture...');
        const profilePath = `${Date.now()}-${data.profilePicture.name}`;
        profilePictureUrl = await uploadFile(data.profilePicture, 'profile-pictures', profilePath);
      }

      // Upload video if provided
      if (data.videoBlob) {
        console.log('Uploading video blob...');
        const videoPath = `${Date.now()}-video.webm`;
        const videoFile = new File([data.videoBlob], 'video.webm', { type: 'video/webm' });
        videoUrl = await uploadFile(videoFile, 'videos', videoPath);
      }

      // Prepare submission data
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

      // Insert submission to database
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

  return (
    <div className="space-y-8">
      <SubmissionForm
        data={data}
        qualityChecked={qualityChecked}
        onContactChange={handleContactChange}
        onQualityCheck={handleQualityCheck}
      />

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
