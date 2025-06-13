
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Upload, CheckCircle2, Mail, User } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';

interface ReviewStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const [checklist, setChecklist] = useState({
    audioVisual: false,
    questionsAddressed: false,
    timeLimit: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChecklistChange = (key: keyof typeof checklist, checked: boolean) => {
    setChecklist(prev => ({ ...prev, [key]: checked }));
  };

  const isFormValid = data.firstName.trim() && data.email.trim() && 
                     Object.values(checklist).every(Boolean) && data.videoBlob;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Review & Submit</CardTitle>
          <p className="text-muted-foreground">
            Final check before submitting your video to the L&T Showcase
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Video Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Play className="h-5 w-5" />
              Video Preview
            </h3>
            
            {data.videoBlob ? (
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
                <video
                  src={URL.createObjectURL(data.videoBlob)}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800">
                  No video recorded. Please go back to record your video.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Quality Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quality Checklist</h3>
            <div className="space-y-3">
              {[
                { 
                  key: 'audioVisual', 
                  label: 'Clear audio and visuals', 
                  description: 'Video is well-lit, audio is clear, and you are properly framed' 
                },
                { 
                  key: 'questionsAddressed', 
                  label: 'All questions addressed', 
                  description: 'You have covered your technology use, teaching innovations, and collaborations' 
                },
                { 
                  key: 'timeLimit', 
                  label: 'Within time limit', 
                  description: 'Video is 2 minutes or less in duration' 
                }
              ].map((item) => (
                <div key={item.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={item.key}
                    checked={checklist[item.key as keyof typeof checklist]}
                    onCheckedChange={(checked) => handleChecklistChange(item.key as keyof typeof checklist, checked as boolean)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor={item.key} className="font-medium text-base cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reviewFirstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name *
                </Label>
                <Input
                  id="reviewFirstName"
                  type="text"
                  value={data.firstName}
                  onChange={(e) => updateData({ firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@rmit.edu.au"
                  value={data.email}
                  onChange={(e) => updateData({ email: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submission Status */}
          {!isFormValid && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                Please complete all required fields and confirm the quality checklist items above.
              </AlertDescription>
            </Alert>
          )}

          {isSubmitting && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Uploading your video... Please wait.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onPrev} disabled={isSubmitting} className="px-8">
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="px-8 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Video
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewStep;
