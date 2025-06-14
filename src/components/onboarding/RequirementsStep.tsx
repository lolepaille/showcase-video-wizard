import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Lightbulb, Volume2, Frame, Clock } from 'lucide-react';

interface RequirementsStepProps {
  onNext: () => void;
  onPrev: () => void;
}

const RequirementsStep: React.FC<RequirementsStepProps> = ({ onNext, onPrev }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const requirements = [
    {
      id: 'framing',
      icon: Frame,
      title: 'Framing',
      description: 'Head and shoulders in frame, centred, with a neutral background',
      tips: 'Position yourself in the center of the frame. Use a plain wall or simple background.',
      good: 'Clean background, centered positioning',
      bad: 'Cluttered background, off-center framing'
    },
    {
      id: 'lighting',
      icon: Lightbulb,
      title: 'Lighting',
      description: 'Well-lit environment, avoid backlighting',
      tips: 'Face a window or light source. Avoid having bright lights behind you.',
      good: 'Even lighting on face, no harsh shadows',
      bad: 'Backlit silhouette, uneven lighting'
    },
    {
      id: 'sound',
      icon: Volume2,
      title: 'Sound',
      description: 'Use a quiet space. External mic preferred if available',
      tips: 'Choose a quiet room. If you have an external microphone, use it for better audio quality.',
      good: 'Clear audio, minimal background noise',
      bad: 'Echo, background noise, muffled audio'
    },
    {
      id: 'duration',
      icon: Clock,
      title: 'Duration',
      description: 'Maximum 2 minutes',
      tips: 'Keep it concise and engaging. Practice beforehand to stay within the time limit.',
      good: 'Concise, under 2 minutes',
      bad: 'Too long, rushed ending'
    }
  ];

  const handleCheck = (id: string, checked: boolean) => {
    const newChecked = new Set(checkedItems);
    if (checked) {
      newChecked.add(id);
    } else {
      newChecked.delete(id);
    }
    setCheckedItems(newChecked);
  };

  const allChecked = checkedItems.size === requirements.length;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Video Requirements Checklist</CardTitle>
          <p className="text-muted-foreground">
            Follow these guidelines to ensure your video meets our quality standards
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {requirements.map((req) => {
              const Icon = req.icon;
              const isChecked = checkedItems.has(req.id);
              
              return (
                <Card key={req.id} className={`transition-all duration-200 ${isChecked ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={req.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleCheck(req.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold">{req.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{req.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <AlertCircle className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-700">{req.tips}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ✓ {req.good}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              ✗ {req.bad}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {allChecked && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Great! You've reviewed all requirements.</span>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onPrev} className="px-8">
              Back
            </Button>
            <Button 
              onClick={onNext}
              disabled={!allChecked}
              className="px-8 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            >
              Continue to Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequirementsStep;
