
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Trophy, Share2, ArrowLeft } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';

interface ConfirmationStepProps {
  data: SubmissionData;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data }) => {
  const handleStartOver = () => {
    window.location.reload();
  };

  const handleViewShowcase = () => {
    window.open('/showcase', '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RMIT L&T Showcase - Wall of High Achievers',
          text: `Check out ${data.fullName}'s submission to the RMIT L&T Showcase!`,
          url: window.location.origin + '/showcase'
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.origin + '/showcase').then(() => {
        alert('Showcase link copied to clipboard!');
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800 mb-2">
            Submission Complete!
          </CardTitle>
          <p className="text-lg text-muted-foreground">
            Thank you for contributing to the RMIT L&T Showcase
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-lg mb-4 text-green-900">What happens next?</h3>
            <div className="space-y-3 text-green-800">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Your submission will be reviewed by our team</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Once approved, it will appear on the Wall of High Achievers</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>You'll receive your RMIT gift as a token of appreciation</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-lg mb-2 text-blue-900">Submission Summary</h3>
            <div className="space-y-2 text-blue-800">
              <p><strong>Name:</strong> {data.fullName}</p>
              <p><strong>Email:</strong> {data.email}</p>
              {data.title && <p><strong>Title:</strong> {data.title}</p>}
              <p><strong>Cluster:</strong> {data.cluster}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleViewShowcase}
              className="flex-1 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              View Showcase
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleShare}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="pt-6 border-t">
            <Button 
              variant="ghost" 
              onClick={handleStartOver}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Submit Another Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationStep;
