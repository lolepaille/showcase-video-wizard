
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SubmissionData } from '@/pages/Index';
import NameEmailFields from './fields/NameEmailFields';
import TitleField from './fields/TitleField';
import ClusterField from './fields/ClusterField';
import ProfilePictureField from './fields/ProfilePictureField';
import WelcomeInfoBox from './WelcomeInfoBox';
import { supabase } from "@/integrations/supabase/client";

interface WelcomeStepProps {
  onNext: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, data, updateData }) => {
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [emailChecked, setEmailChecked] = useState('');

  function validateEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  // Check if email already exists
  useEffect(() => {
    const checkEmail = async () => {
      if (validateEmail(data.email)) {
        setCheckingEmail(true);
        const { data: found, error } = await supabase
          .from('submissions')
          .select('id')
          .eq('email', data.email)
          .limit(1);
        setAlreadySubmitted(found?.length > 0);
        setEmailChecked(data.email);
        setCheckingEmail(false);
      } else {
        setAlreadySubmitted(false);
        setEmailChecked('');
      }
    };

    if (data.email) {
      checkEmail();
    }
  }, [data.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      data.fullName.trim() &&
      data.email.trim() &&
      data.cluster &&
      validateEmail(data.email)
    ) {
      setRegistering(true);
      setRegisterError(null);
      try {
        onNext();
      } catch (err: any) {
        setRegisterError("Unknown error occurred. Please try again.");
      } finally {
        setRegistering(false);
      }
    }
  };

  const isFormValid =
    !!data.fullName.trim() &&
    !!data.email.trim() &&
    !!data.cluster &&
    validateEmail(data.email);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-600 to-red-600 rounded-full w-16 h-16 flex items-center justify-center overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=64&h=64&fit=crop&crop=center" 
              alt="RMIT Logo"
              className="w-10 h-10 object-contain filter brightness-0 invert"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            Congratulations!
          </CardTitle>
          <p className="text-lg text-muted-foreground mt-2">
            You&apos;ve been selected for the L&amp;T Showcase &quot;Wall of High Achievers&quot;
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <NameEmailFields
              fullName={data.fullName}
              email={data.email}
              updateData={updateData}
              emailChecked={emailChecked}
              alreadySubmitted={alreadySubmitted}
              checkingEmail={checkingEmail}
              validateEmail={validateEmail}
            />
            <TitleField title={data.title} updateData={updateData} />
            <ClusterField value={data.cluster} updateData={updateData} />
            <ProfilePictureField profilePicture={data.profilePicture} updateData={updateData} />

            <WelcomeInfoBox />

            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
              disabled={!isFormValid || registering}
            >
              {registering ? "Continuing..." : "Let's Get Started"}
            </Button>
            {registerError && (
              <div className="text-red-600 text-center mt-2">{registerError}</div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeStep;
