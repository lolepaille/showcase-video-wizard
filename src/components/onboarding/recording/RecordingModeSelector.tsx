import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Camera, Monitor, Presentation } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // On mobile, show ONLY "Camera Only" and camera facing. Not screen or both.
  const availableModes: {
    value: RecordingMode;
    icon: React.ReactNode;
    label: string;
    desc: string;
    hide?: boolean;
  }[] = [
    {
      value: 'camera',
      icon: <Camera className="h-5 w-5" />,
      label: 'Camera Only',
      desc: 'Traditional video recording',
      hide: false,
    },
    {
      value: 'screen',
      icon: <Monitor className="h-5 w-5" />,
      label: 'Screen Only',
      desc: 'Record your screen/presentation',
      hide: isMobile, // hide on mobile
    },
    {
      value: 'both',
      icon: <Presentation className="h-5 w-5" />,
      label: 'Screen + Camera',
      desc: 'Presentation with you in corner',
      hide: isMobile, // hide on mobile
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose Recording Mode</h3>
      <RadioGroup
        value={recordingMode}
        onValueChange={(value) => onRecordingModeChange(value as RecordingMode)}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {availableModes
          .filter((item) => !item.hide)
          .map((item) => (
            <div
              key={item.value}
              className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <RadioGroupItem value={item.value} id={item.value} />
              <Label htmlFor={item.value} className="flex items-center gap-2 cursor-pointer">
                {item.icon}
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </Label>
            </div>
          ))}
      </RadioGroup>

      {/* Camera Facing Selector - on mobile only, and only show "Back" option if mobile */}
      {isMobile && recordingMode === 'camera' && (
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
            {/* Only show back camera if device is mobile */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="back" id="back-facing" />
              <Label htmlFor="back-facing" className="cursor-pointer">Back</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      {/* On desktop/larger screens, show facing if in camera or both */}
      {!isMobile && (recordingMode === 'camera' || recordingMode === 'both') && (
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
