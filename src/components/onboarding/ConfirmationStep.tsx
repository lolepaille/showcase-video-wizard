
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trophy, Mail, Phone } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';

interface ConfirmationStepProps {
  data: SubmissionData;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full w-20 h-20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Submission Complete!
          </CardTitle>
          <p className="text-lg text-muted-foreground mt-2">
            Thank you for your contribution to the L&T Showcase
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Your video has been received</h3>
            </div>
            <div className="text-green-700 space-y-2">
              <p><strong>Submitted by:</strong> {data.firstName}</p>
              <p><strong>Email:</strong> {data.email}</p>
              <p><strong>Submission Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">What happens next?</h3>
            </div>
            <ul className="text-blue-700 space-y-2">
              <li>• Your video will be reviewed by our team</li>
              <li>• We'll prepare it for the Wall of High Achievers showcase</li>
              <li>• You'll receive your RMIT gift as a thank you</li>
              <li>• Your innovation will inspire colleagues across the university</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Need Support?
            </h3>
            <div className="text-gray-700 space-y-3">
              <p>If you have any questions or need assistance, please contact:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span><strong>Elvin William:</strong> elvin.william@rmit.edu.au</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span><strong>Rebekah Brown:</strong> rebekah.brown@rmit.edu.au</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-8"
            >
              Submit Another Video
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for being part of RMIT's learning and teaching excellence!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationStep;
