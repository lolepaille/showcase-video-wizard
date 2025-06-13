
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';
import VideoPreview from './VideoPreview';
import QualityChecklist from './QualityChecklist';
import ContactInformation from './ContactInformation';
import SubmissionStatus from './SubmissionStatus';

interface ReviewStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

interface ChecklistState {
  audioVisual: boolean;
  questionsAddressed: boolean;
  timeLimit: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const [checklist, setChecklist] = useState<ChecklistState>({
    audioVisual: false,
    questionsAddressed: false,
    timeLimit: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChecklistChange = (key: keyof ChecklistState, checked: boolean) => {
    setChecklist(prev => ({ ...prev, [key]: checked }));
  };

  const isFormValid = data.firstName.trim() && data.email.trim() && 
                     Object.values(checklist).every(Boolean) && !!data.videoBlob;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Review & Submit</CardTitle>
          <p className="text-muted-foreground">
            Final check before submitting your video to the L&T Showcase
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <VideoPreview videoBlob={data.videoBlob} />

          <QualityChecklist 
            checklist={checklist}
            onChecklistChange={handleChecklistChange}
          />

          <ContactInformation
            firstName={data.firstName}
            email={data.email}
            onFirstNameChange={(value) => updateData({ firstName: value })}
            onEmailChange={(value) => updateData({ email: value })}
          />

          <SubmissionStatus 
            isFormValid={isFormValid}
            isSubmitting={isSubmitting}
          />

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
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Video
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
