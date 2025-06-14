
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import SubmissionStatus from './SubmissionStatus';

interface SubmissionActionsProps {
  isFormValid: boolean;
  isSubmitting: boolean;
  onPrev: () => void;
  onSubmit: () => void;
}

const SubmissionActions: React.FC<SubmissionActionsProps> = ({
  isFormValid,
  isSubmitting,
  onPrev,
  onSubmit
}) => {
  return (
    <div className="space-y-4">
      <SubmissionStatus isFormValid={isFormValid} isSubmitting={isSubmitting} />

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} disabled={isSubmitting} className="px-8">
          Back
        </Button>
        <Button 
          onClick={onSubmit}
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
    </div>
  );
};

export default SubmissionActions;
