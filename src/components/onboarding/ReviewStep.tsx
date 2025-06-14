
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ContactInformation from './ContactInformation';
import VideoPreview from './VideoPreview';
import QualityChecklist from './QualityChecklist';
import SubmissionStatus from './SubmissionStatus';
import { Send, CheckCircle } from 'lucide-react';
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
    audioQuality: false,
    videoQuality: false,
    contentRelevant: false,
    withinTimeLimit: false,
  });
  const { toast } = useToast();

  const handleContactChange = (field: string, value: string | ClusterType) => {
    updateData({ [field]: value });
  };

  const handleQualityCheck = (item: string, checked: boolean) => {
    setQualityChecked(prev => ({ ...prev, [item]: checked }));
  };

  const isFormValid = 
    data.firstName.trim() && 
    data.email.trim() && 
    data.cluster &&
    data.videoBlob &&
    Object.values(qualityChecked).every(Boolean);

  const uploadFile = async (file: File | Blob, bucket: string, path: string): Promise<string | null> => {
    try {
      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      let profilePictureUrl = null;
      let videoUrl = null;

      // Upload profile picture if provided
      if (data.profilePicture) {
        const timestamp = Date.now();
        const profilePath = `${timestamp}-${data.firstName.replace(/\s+/g, '-')}-profile.${data.profilePicture.name.split('.').pop()}`;
        profilePictureUrl = await uploadFile(data.profilePicture, 'profile-pictures', profilePath);
        
        if (!profilePictureUrl) {
          toast({
            title: "Upload Error",
            description: "Failed to upload profile picture. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // Upload video
      if (data.videoBlob) {
        const timestamp = Date.now();
        const videoPath = `${timestamp}-${data.firstName.replace(/\s+/g, '-')}-video.webm`;
        videoUrl = await uploadFile(data.videoBlob, 'videos', videoPath);
        
        if (!videoUrl) {
          toast({
            title: "Upload Error", 
            description: "Failed to upload video. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // Save submission to database
      const { data: submission, error } = await supabase
        .from('submissions')
        .insert({
          first_name: data.firstName,
          email: data.email,
          title: data.title || null,
          cluster: data.cluster as ClusterType,
          profile_picture_url: profilePictureUrl,
          video_url: videoUrl,
          notes: data.notes,
          is_published: false
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Submission Error",
          description: "Failed to save submission. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Your submission has been uploaded successfully.",
      });

      onNext();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Review Your Submission
          </CardTitle>
          <p className="text-muted-foreground">
            Please review your information and video before submitting
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <ContactInformation
            firstName={data.firstName}
            email={data.email}
            title={data.title}
            cluster={data.cluster}
            onFirstNameChange={(value) => handleContactChange('firstName', value)}
            onEmailChange={(value) => handleContactChange('email', value)}
            onTitleChange={(value) => handleContactChange('title', value)}
            onClusterChange={(value) => handleContactChange('cluster', value)}
          />

          {data.profilePicture && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Profile Picture</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={URL.createObjectURL(data.profilePicture)} 
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <p className="text-sm text-gray-600">{data.profilePicture.name}</p>
              </div>
            </div>
          )}

          <VideoPreview videoBlob={data.videoBlob} />

          <QualityChecklist 
            checkedItems={qualityChecked}
            onItemChange={handleQualityCheck}
          />

          <SubmissionStatus isFormValid={isFormValid} isSubmitting={isSubmitting} />

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onPrev} disabled={isSubmitting} className="px-8">
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="px-8 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewStep;
