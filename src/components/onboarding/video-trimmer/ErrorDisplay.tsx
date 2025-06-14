
import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void; // Make onRetry optional
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <p className="text-red-800 flex-grow mr-2">{error}</p>
        {onRetry && ( // Only show retry button if onRetry is provided
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-red-600 border-red-300 whitespace-nowrap"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;

