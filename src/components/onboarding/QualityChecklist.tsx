
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ChecklistState {
  audioVisual: boolean;
  questionsAddressed: boolean;
  timeLimit: boolean;
}

interface QualityChecklistProps {
  checklist: ChecklistState;
  onChecklistChange: (key: keyof ChecklistState, checked: boolean) => void;
}

const QualityChecklist: React.FC<QualityChecklistProps> = ({ checklist, onChecklistChange }) => {
  const checklistItems = [
    { 
      key: 'audioVisual' as const, 
      label: 'Clear audio and visuals', 
      description: 'Video is well-lit, audio is clear, and you are properly framed' 
    },
    { 
      key: 'questionsAddressed' as const, 
      label: 'All questions addressed', 
      description: 'You have covered your technology use, teaching innovations, and collaborations' 
    },
    { 
      key: 'timeLimit' as const, 
      label: 'Within time limit', 
      description: 'Video is 2 minutes or less in duration' 
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Quality Checklist</h3>
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div key={item.key} className="flex items-start space-x-3 p-3 border rounded-lg">
            <Checkbox
              id={item.key}
              checked={checklist[item.key]}
              onCheckedChange={(checked) => onChecklistChange(item.key, checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor={item.key} className="font-medium text-base cursor-pointer">
                {item.label}
              </Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityChecklist;
