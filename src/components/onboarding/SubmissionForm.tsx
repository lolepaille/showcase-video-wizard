
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import ContactInformation from './ContactInformation';
import QualityChecklist from './QualityChecklist';
import type { SubmissionData, ClusterType } from '@/pages/Index';

// Accept new hideVideoPreview prop for conditional video rendering
interface QualityChecked {
  audioVisual: boolean;
  questionsAddressed: boolean;
  timeLimit: boolean;
}

interface SubmissionFormProps {
  data: SubmissionData;
  qualityChecked: QualityChecked;
  onContactChange: (field: string, value: string | ClusterType) => void;
  onQualityCheck: (key: keyof QualityChecked, checked: boolean) => void;
  hideVideoPreview?: boolean;
  children?: React.ReactNode; // <-- NEW
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({
  data,
  qualityChecked,
  onContactChange,
  onQualityCheck,
  hideVideoPreview = false,
  children,
}) => {
  return (
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
          fullName={data.fullName}
          email={data.email}
          title={data.title}
          cluster={data.cluster}
          onFullNameChange={(value) => onContactChange('fullName', value)}
          onEmailChange={(value) => onContactChange('email', value)}
          onTitleChange={(value) => onContactChange('title', value)}
          onClusterChange={(value) => onContactChange('cluster', value)}
        />

        {/* NEW: Render children here between info and checklist */}
        {children}

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

        {/* 
          VideoPreview is now managed from parent, so always pass hideVideoPreview 
        */}

        <QualityChecklist 
          checklist={qualityChecked}
          onChecklistChange={onQualityCheck}
        />
      </CardContent>
    </Card>
  );
};

export default SubmissionForm;

