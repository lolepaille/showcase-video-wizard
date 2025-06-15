import React, { useState, useEffect, useRef } from 'react';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import RequirementsStep from '@/components/onboarding/RequirementsStep';
import QuestionsStep from '@/components/onboarding/QuestionsStep';
import RecordingStep from '@/components/onboarding/RecordingStep';
import ReviewStep from '@/components/onboarding/ReviewStep';
import ConfirmationStep from '@/components/onboarding/ConfirmationStep';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { ensureStorageBuckets } from '@/lib/storage-setup';
import AuthPage from './Auth'; // Add this import, but used only for redirect logic below
import { supabase } from '@/integrations/supabase/client';

export type OnboardingStep = 'welcome' | 'requirements' | 'questions' | 'recording' | 'review' | 'confirmation';

export type ClusterType = 'Future Tech' | 'Built Environment & Sustainability' | 'Creative Industries' | 'Business & Enterprise' | 'Social Care & Health';

export interface SubmissionData {
  fullName: string;
  email: string;
  title: string;
  cluster: ClusterType | '';
  profilePicture?: File;
  notes: {
    question1: string;
    question2: string;
    question3: string;
  };
  videoBlob?: Blob;
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    fullName: '',
    email: '',
    title: '',
    cluster: '',
    notes: {
      question1: '',
      question2: '',
      question3: '',
    },
  });

  // Ref for auto-scroll to top
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top of viewport on step change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Initialize storage buckets on component mount
  useEffect(() => {
    ensureStorageBuckets();
  }, []);

  // Auth state
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const steps: OnboardingStep[] = ['welcome', 'requirements', 'questions', 'recording', 'review', 'confirmation'];
  const currentStepIndex = steps.indexOf(currentStep);

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const updateData = (data: Partial<SubmissionData>) => {
    setSubmissionData(prev => ({ ...prev, ...data }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} data={submissionData} updateData={updateData} />;
      case 'requirements':
        return <RequirementsStep onNext={nextStep} onPrev={prevStep} />;
      case 'questions':
        return <QuestionsStep onNext={nextStep} onPrev={prevStep} data={submissionData} updateData={updateData} />;
      case 'recording':
        return <RecordingStep onNext={nextStep} onPrev={prevStep} data={submissionData} updateData={updateData} />;
      case 'review':
        return <ReviewStep onNext={nextStep} onPrev={prevStep} data={submissionData} updateData={updateData} />;
      case 'confirmation':
        return <ConfirmationStep data={submissionData} />;
      default:
        return null;
    }
  };

  // After welcome step, require authentication
  if (!checkingAuth && currentStep !== 'welcome' && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow-xl">
          <h2 className="text-xl font-bold mb-2">Please sign up or log in to submit</h2>
          <a
            href="/auth"
            className="inline-block underline text-blue-600 hover:text-blue-800"
          >
            Proceed to Auth Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {currentStep !== 'confirmation' && (
          <ProgressBar currentStep={currentStepIndex} totalSteps={steps.length - 1} />
        )}
        <div className="animate-fade-in">
          {renderCurrentStep()}
        </div>
      </div>
      
      {/* Bottom navigation links */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        <a 
          href="/admin" 
          className="text-sm text-blue-600 hover:text-blue-800 bg-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-blue-200 pointer-events-auto"
          title="Admin Access"
        >
          Admin Portal
        </a>
        <a 
          href="/showcase" 
          className="text-sm text-green-600 hover:text-green-800 bg-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-green-200 pointer-events-auto"
          title="View Showcase"
        >
          View Showcase
        </a>
      </div>
    </div>
  );
};

export default Index;
