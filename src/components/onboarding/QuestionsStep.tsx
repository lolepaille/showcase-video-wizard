
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Users, Rocket } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';
import VideoUploadOption from './VideoUploadOption';

interface QuestionsStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const questions = [
    {
      id: 'question1',
      icon: Rocket,
      title: 'Technology & AI Innovation',
      question: 'How are you using technology or AI to enhance student learning or engagement?',
      placeholder: 'Describe specific tools, platforms, or AI applications you use and their impact on student learning...',
      color: 'blue'
    },
    {
      id: 'question2',
      icon: Lightbulb,
      title: 'Teaching Innovation',
      question: 'What change or innovation in your teaching practice has had the most impact—and why?',
      placeholder: 'Share a specific change you made to your teaching approach and the results you observed...',
      color: 'purple'
    },
    {
      id: 'question3',
      icon: Users,
      title: 'Collaboration & Industry',
      question: 'How have you collaborated with colleagues or industry to improve your students\' learning outcomes?',
      placeholder: 'Describe partnerships, collaborations, or industry connections that enhanced student learning...',
      color: 'green'
    }
  ];

  const updateNotes = (questionId: string, value: string) => {
    updateData({
      notes: {
        ...data.notes,
        [questionId]: value
      }
    });
  };

  // Allow QuestionsStep to transition to review step if a video is uploaded
  const handleVideoFile = (file: File | null) => {
    if (file) {
      updateData({ videoBlob: file });
      // Simulate direct step to review. We need onNext twice: once to recording, once to review.
      onNext(); // from questions -> recording
      setTimeout(onNext, 50); // quickly to review; WAIT at least briefly for state to update
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Prepare Your Responses</CardTitle>
          <p className="text-muted-foreground">
            Take a moment to think about these questions. You can draft notes here to help guide your video recording.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {questions.map((q, index) => {
            const Icon = q.icon;
            return (
              <Card key={q.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-${q.color}-100`}>
                      <Icon className={`h-6 w-6 text-${q.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-lg">{q.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-4 font-medium">{q.question}</p>
                      
                      <div className="space-y-2">
                        <Label htmlFor={q.id} className="text-sm font-medium text-gray-600">
                          Draft your response (optional)
                        </Label>
                        <Textarea
                          id={q.id}
                          placeholder={q.placeholder}
                          value={data.notes[q.id as keyof typeof data.notes]}
                          onChange={(e) => updateNotes(q.id, e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Recording Tips</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• You don't need to answer all questions in order</li>
                  <li>• Feel free to combine answers naturally in your video</li>
                  <li>• Keep it conversational and authentic</li>
                  <li>• Practice once before your final recording</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
            <div className="flex-1 flex flex-row gap-3 w-full md:w-auto">
              <Button variant="outline" onClick={onPrev} className="px-8">
                Back
              </Button>
              <Button 
                onClick={onNext}
                className="px-8 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
              >
                Ready to Record
              </Button>
            </div>
            <div className="flex-1 w-full md:w-auto flex flex-row gap-3 justify-end">
              <VideoUploadOption onVideoFile={handleVideoFile} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionsStep;

