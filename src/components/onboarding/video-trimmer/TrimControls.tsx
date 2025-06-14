
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface TrimControlsProps {
  currentTime: number;
  duration: number;
  startTime: number;
  endTime: number;
  onCurrentTimeChange: (value: number[]) => void;
  onStartTimeChange: (value: number[]) => void;
  onEndTimeChange: (value: number[]) => void;
}

const TrimControls: React.FC<TrimControlsProps> = ({
  currentTime,
  duration,
  startTime,
  endTime,
  onCurrentTimeChange,
  onStartTimeChange,
  onEndTimeChange
}) => {
  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Timeline Scrubber */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Current Position</div>
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={onCurrentTimeChange}
          className="w-full"
        />
      </div>

      {/* Trim Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center justify-between">
            <span>Start Time</span>
            <span className="text-muted-foreground">{formatTime(startTime)}</span>
          </div>
          <Slider
            value={[startTime]}
            max={duration}
            step={0.1}
            onValueChange={onStartTimeChange}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center justify-between">
            <span>End Time</span>
            <span className="text-muted-foreground">{formatTime(endTime)}</span>
          </div>
          <Slider
            value={[endTime]}
            max={duration}
            step={0.1}
            onValueChange={onEndTimeChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Trim Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-center">
          <h4 className="font-medium text-blue-800">Trimmed Duration</h4>
          <p className="text-2xl font-bold text-blue-600">{formatTime(endTime - startTime)}</p>
          <p className="text-sm text-blue-700 mt-1">
            From {formatTime(startTime)} to {formatTime(endTime)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrimControls;
