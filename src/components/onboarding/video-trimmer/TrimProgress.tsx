
import React from 'react';
import { Button } from '@/components/ui/button';

interface TrimProgressProps {
  isVisible: boolean;
  progress: number;
  onCancel: () => void;
}

const TrimProgress: React.FC<TrimProgressProps> = ({
  isVisible,
  progress,
  onCancel
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg font-medium">Trimming Video...</p>
        <p className="text-sm">{Math.round(progress)}% Complete</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="mt-4 text-white border-white hover:bg-white hover:text-black"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default TrimProgress;
