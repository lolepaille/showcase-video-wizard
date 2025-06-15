
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Camera, Monitor, Presentation } from 'lucide-react';

type RecordingMode = 'camera' | 'screen' | 'both';
type CameraFacing = 'front' | 'back';

interface RecordingModeSelectorProps {
  recordingMode: RecordingMode;
  cameraFacing: CameraFacing;
  onRecordingModeChange: (mode: RecordingMode) => void;
  onCameraFacingChange: (facing: CameraFacing) => void;
}

const RecordingModeSelector: React.FC<RecordingModeSelectorProps> = ({
  recordingMode,
  cameraFacing,
  onRecordingModeChange,
  onCameraFacingChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose Recording Mode</h3>
      <RadioGroup 
        value={recordingMode} 
        onValueChange={(value) => onRecordingModeChange(value as RecordingMode)}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
          <RadioGroupItem value="camera" id="camera" />
          <Label htmlFor="camera" className="flex items-center gap-2 cursor-pointer">
            <Camera className="h-5 w-5" />
            <div>
              <div className="font-medium">Camera Only</div>
              <div className="text-sm text-muted-foreground">Traditional video recording</div>
            </div>
          </Label>
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
          <RadioGroupItem value="screen" id="screen" />
          <Label htmlFor="screen" className="flex items-center gap-2 cursor-pointer">
            <Monitor className="h-5 w-5" />
            <div>
              <div className="font-medium">Screen Only</div>
              <div className="text-sm text-muted-foreground">Record your screen/presentation</div>
            </div>
          </Label>
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
          <RadioGroupItem value="both" id="both" />
          <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
            <Presentation className="h-5 w-5" />
            <div>
              <div className="font-medium">Screen + Camera</div>
              <div className="text-sm text-muted-foreground">Presentation with you in corner</div>
            </div>
          </Label>
        </div>
      </RadioGroup>
      
      {/* Camera Facing Selector */}
      {(recordingMode === 'camera' || recordingMode === 'both') && (
        <div className="flex gap-4 items-center mt-3">
          <span className="text-sm font-medium">Camera Facing:</span>
          <RadioGroup 
            value={cameraFacing}
            onValueChange={(val) => onCameraFacingChange(val as CameraFacing)}
            className="flex gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="front" id="front-facing" />
              <Label htmlFor="front-facing" className="cursor-pointer">Front</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="back" id="back-facing" />
              <Label htmlFor="back-facing" className="cursor-pointer">Back</Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
};

export default RecordingModeSelector;
