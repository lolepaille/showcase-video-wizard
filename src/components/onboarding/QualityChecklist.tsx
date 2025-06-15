
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

const QualityChecklist: React.FC<QualityChecklistProps> = ({ checklist, onChecklistChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Quality Checklist</h3>
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`w-full flex items-start space-x-3 p-3 border rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group ${
              checklist[item.key]
                ? 'bg-blue-50 border-blue-300'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onChecklistChange(item.key, !checklist[item.key])}
            aria-pressed={checklist[item.key]}
            tabIndex={0}
          >
            <Checkbox
              id={item.key}
              checked={checklist[item.key]}
              tabIndex={-1}
              className="mt-1 pointer-events-none"
            />
            <div className="flex-1 text-left">
              <Label htmlFor={item.key} className="font-medium text-base cursor-pointer group-hover:underline">
                {item.label}
              </Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QualityChecklist;

