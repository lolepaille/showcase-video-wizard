
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Gift } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';

interface WelcomeStepProps {
  onNext: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, data, updateData }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.firstName.trim()) {
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-600 to-red-600 rounded-full w-16 h-16 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            Congratulations!
          </CardTitle>
          <p className="text-lg text-muted-foreground mt-2">
            You've been selected for the L&T Showcase "Wall of High Achievers"
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-base font-medium">
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
                required
                className="text-lg h-12"
              />
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-4 text-blue-900">What you need to know:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800"><strong>Deadline:</strong> 27 October</span>
                </div>
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800"><strong>Reward:</strong> RMIT gift for your contribution</span>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span className="text-blue-800"><strong>Showcase:</strong> Your video will be featured in our Wall of High Achievers</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                We'll guide you through creating a short video (max 2 minutes) showcasing your innovative 
                teaching practices. This is your opportunity to share how you're making a difference in 
                student learning and inspire your colleagues.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
              disabled={!data.firstName.trim()}
            >
              Let's Get Started
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeStep;
