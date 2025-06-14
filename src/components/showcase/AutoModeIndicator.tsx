
import React from 'react';

interface AutoModeIndicatorProps {
  isActive: boolean;
}

const AutoModeIndicator: React.FC<AutoModeIndicatorProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-300 rounded-lg px-4 py-2">
      <div className="flex items-center gap-2 text-green-800">
        <div className="animate-pulse w-2 h-2 bg-green-600 rounded-full"></div>
        Auto Mode Active
      </div>
    </div>
  );
};

export default AutoModeIndicator;
