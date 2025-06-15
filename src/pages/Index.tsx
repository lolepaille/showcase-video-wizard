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

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        {currentStep !== 'confirmation' && (
          <ProgressBar currentStep={currentStepIndex} totalSteps={steps.length - 1} />
        )}
        <div className="animate-fade-in">
          {renderCurrentStep()}
        </div>
      </div>
      {/* Footer with navigation links - removed user submissions link */}
      <footer className="w-full border-t bg-white/80 py-4 mt-8 backdrop-blur flex flex-col md:flex-row items-center justify-between gap-5">
        <a 
          href="/admin/dashboard" 
          className="text-sm text-blue-600 hover:text-blue-800 bg-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-blue-200"
          title="Admin Dashboard"
        >
          Admin Dashboard
        </a>
        <a 
          href="/showcase" 
          className="text-sm text-green-600 hover:text-green-800 bg-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-green-200"
          title="View Showcase"
        >
          View Showcase
        </a>
      </footer>
    </div>
  );
};

export default Index;
