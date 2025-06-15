
import React from 'react';
import { Mic } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const RecordingTips: React.FC = () => {
  const isMobile = useIsMobile();
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Mic className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Recording Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Camera:</strong> {isMobile ? `Use your device's front or back camera` : `Traditional face-to-face recording`}</li>
            {!isMobile && (
              <>
                <li>• <strong>Screen:</strong> Perfect for presentations and demos</li>
                <li>• <strong>Both:</strong> Present with your face in the corner</li>
              </>
            )}
            <li>• Maximum recording time is 2 minutes</li>
            <li>• Your video can be trimmed by admins during review</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecordingTips;
