
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubmissionStatusProps {
  isFormValid: boolean;
  isSubmitting: boolean;
}

const SubmissionStatus: React.FC<SubmissionStatusProps> = ({ isFormValid, isSubmitting }) => {
  return (
    <>
      {!isFormValid && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            Please complete all required fields and confirm the quality checklist items above.
          </AlertDescription>
        </Alert>
      )}

      {isSubmitting && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Uploading your video... Please wait.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default SubmissionStatus;
