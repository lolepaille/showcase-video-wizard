
import React, { useState } from 'react';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import RequirementsStep from '@/components/onboarding/RequirementsStep';
import QuestionsStep from '@/components/onboarding/QuestionsStep';
import RecordingStep from '@/components/onboarding/RecordingStep';
import ReviewStep from '@/components/onboarding/ReviewStep';
import ConfirmationStep from '@/components/onboarding/ConfirmationStep';
import ProgressBar from '@/components/onboarding/ProgressBar';

export type OnboardingStep = 'welcome' | 'requirements' | 'questions' | 'recording' | 'review' | 'confirmation';

export type ClusterType = 'Future Tech' | 'Built Environment & Sustainability' | 'Creative Industries' | 'Business & Enterprise' | 'Social Care & Health';

export interface SubmissionData {
  firstName: string;
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
    firstName: '',
    email: '',
    title: '',
    cluster: '',
    notes: {
      question1: '',
      question2: '',
      question3: '',
    },
  });

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {currentStep !== 'confirmation' && (
          <ProgressBar currentStep={currentStepIndex} totalSteps={steps.length - 1} />
        )}
        <div className="animate-fade-in">
          {renderCurrentStep()}
        </div>
        
        {/* Discreet admin link */}
        <div className="fixed bottom-4 left-4 opacity-10 hover:opacity-100 transition-opacity">
          <a 
            href="/admin" 
            className="text-xs text-gray-400 hover:text-gray-600"
            title="Admin Access"
          >
            •
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
