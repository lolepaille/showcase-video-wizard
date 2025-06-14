
import React, { useState } from 'react';
import SubmissionForm from './SubmissionForm';
import SubmissionActions from './SubmissionActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SubmissionData, ClusterType } from '@/pages/Index';

interface ReviewStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qualityChecked, setQualityChecked] = useState({
    audioVisual: false,
    questionsAddressed: false,
    timeLimit: false,
  });
  const { toast } = useToast();

  const handleContactChange = (field: string, value: string | ClusterType) => {
    updateData({ [field]: value });
  };

  const handleQualityCheck = (key: keyof typeof qualityChecked, checked: boolean) => {
    setQualityChecked(prev => ({ ...prev, [key]: checked }));
  };

  const isFormValid = 
    data.firstName.trim() && 
    data.email.trim() && 
    data.cluster &&
    data.videoBlob &&
    Object.values(qualityChecked).every(Boolean);

  const uploadFile = async (file: File | Blob, bucket: string, path: string): Promise<string | null> => {
    try {
      console.log(`Uploading file to ${bucket}/${path}`, file);
      
      // Convert Blob to File if needed
      let fileToUpload = file;
      if (file instanceof Blob && !(file instanceof File)) {
        fileToUpload = new File([file], path, { type: file.type || 'video/webm' });
      }
      
      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(path, fileToUpload, {
          cacheControl: '3600',
          upsert: true,
          contentType: fileToUpload instanceof File ? fileToUpload.type : 'video/webm'
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', uploadData);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log('Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      console.log('Starting submission process...');
      
      let profilePictureUrl = null;
      let videoUrl = null;

      // Upload profile picture if provided
      if (data.profilePicture) {
        const timestamp = Date.now();
        const fileExtension = data.profilePicture.name.split('.').pop() || 'jpg';
        const profilePath = `${timestamp}-${data.firstName.replace(/\s+/g, '-')}-profile.${fileExtension}`;
        profilePictureUrl = await uploadFile(data.profilePicture, 'profile-pictures', profilePath);
      }

      // Upload video
      if (data.videoBlob) {
        const timestamp = Date.now();
        const videoPath = `${timestamp}-${data.firstName.replace(/\s+/g, '-')}-video.webm`;
        videoUrl = await uploadFile(data.videoBlob, 'videos', videoPath);
      }

      console.log('Files uploaded successfully, saving to database...');

      // Save submission to database
      const submissionData = {
        first_name: data.firstName,
        email: data.email,
        title: data.title || null,
        cluster: data.cluster as ClusterType,
        profile_picture_url: profilePictureUrl,
        video_url: videoUrl,
        notes: data.notes,
        is_published: false
      };

      console.log('Submission data:', submissionData);

      const { data: submission, error } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Submission saved successfully:', submission);

      toast({
        title: "Success!",
        description: "Your submission has been uploaded successfully.",
      });

      onNext();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SubmissionForm
        data={data}
        qualityChecked={qualityChecked}
        onContactChange={handleContactChange}
        onQualityCheck={handleQualityCheck}
      />
      
      <SubmissionActions
        isFormValid={isFormValid}
        isSubmitting={isSubmitting}
        onPrev={onPrev}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ReviewStep;
