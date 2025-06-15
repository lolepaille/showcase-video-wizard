import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Calendar, Gift, Upload, AlertTriangle } from 'lucide-react';
import type { SubmissionData, ClusterType } from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';

interface WelcomeStepProps {
  onNext: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const clusters: ClusterType[] = [
  'Future Tech',
  'Built Environment & Sustainability',
  'Creative Industries',
  'Business & Enterprise',
  'Social Care & Health'
];

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, data, updateData }) => {
  // State to track whether email already exists (has submission)
  const [emailChecked, setEmailChecked] = useState<string>('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Debounce email checking for request efficiency
  useEffect(() => {
    setAlreadySubmitted(false);
    if (!data.email || !validateEmail(data.email)) {
      setEmailChecked('');
      return;
    }

    setCheckingEmail(true);
    const handle = setTimeout(async () => {
      try {
        // Query the submissions table for this email
        const { data: submissions, error } = await supabase
          .from('submissions')
          .select('id')
          .eq('email', data.email);

        setEmailChecked(data.email);
        if (submissions && submissions.length > 0) {
          setAlreadySubmitted(true);
        } else {
          setAlreadySubmitted(false);
        }
      } catch {
        setAlreadySubmitted(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [data.email]);

  function validateEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  const [backendUserId, setBackendUserId] = useState<string | null>(null);

  // Add loading/error UI for registration
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      data.fullName.trim() &&
      data.email.trim() &&
      data.cluster &&
      !alreadySubmitted
    ) {
      // Register user via edge function (does not force sign in)
      setRegistering(true);
      setRegisterError(null);
      try {
        const response = await fetch("/functions/v1/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email.trim(),
            fullName: data.fullName.trim(),
            cluster: data.cluster,
            title: data.title?.trim() || undefined,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to register user");
        }
        setBackendUserId(result.user_id);
        // Save userId in localStorage/session for later submission
        window.localStorage.setItem("registered_user_id", result.user_id);
        onNext();
      } catch (err: any) {
        setRegisterError(err.message);
      } finally {
        setRegistering(false);
      }
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateData({ profilePicture: file });
    }
  };

  const isFormValid =
    !!data.fullName.trim() &&
    !!data.email.trim() &&
    !!data.cluster &&
    !alreadySubmitted &&
    validateEmail(data.email);

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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-base font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={data.fullName}
                  onChange={(e) => updateData({ fullName: e.target.value })}
                  required
                  className="text-lg h-12"
                  autoComplete="name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@rmit.edu.au"
                  value={data.email}
                  onChange={(e) => updateData({ email: e.target.value })}
                  required
                  className="text-lg h-12"
                  autoComplete="email"
                />
                {checkingEmail && !!data.email && validateEmail(data.email) && (
                  <p className="text-blue-600 text-sm mt-1">Checking for previous submission...</p>
                )}
                {!!data.email &&
                  alreadySubmitted &&
                  !checkingEmail &&
                  emailChecked === data.email && (
                  <div className="flex items-start bg-amber-100 border-l-4 border-amber-500 rounded-md p-3 mt-2 gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-amber-800 text-sm font-semibold mb-1">
                        Submission already received!
                      </p>
                      <p className="text-amber-800 text-sm">
                        Our records show a submission with this email. If you need to replace your video or update your profile, please contact{' '}
                        <a
                          href="mailto:dmd.cove@rmit.edu.au"
                          className="underline text-blue-700 hover:text-blue-900"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          dmd.cove@rmit.edu.au
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                Title
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Senior Lecturer, Associate Professor"
                value={data.title}
                onChange={(e) => updateData({ title: e.target.value })}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cluster" className="text-base font-medium">
                Cluster *
              </Label>
              <Select value={data.cluster} onValueChange={(value: ClusterType) => updateData({ cluster: value })}>
                <SelectTrigger className="text-lg h-12">
                  <SelectValue placeholder="Select your cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePicture" className="text-base font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Profile Picture (Optional)
              </Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="text-lg h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {data.profilePicture && (
                <p className="text-sm text-green-600">✓ {data.profilePicture.name}</p>
              )}
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
              disabled={!isFormValid || registering}
            >
              {registering ? "Registering..." : "Let's Get Started"}
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

// NOTE: src/components/onboarding/WelcomeStep.tsx is getting quite long. Consider asking me to refactor soon!
