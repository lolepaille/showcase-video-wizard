import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, RotateCcw, CheckCircle2, Camera, Mic } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';

interface RecordingStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

const RecordingStep: React.FC<RecordingStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(data.videoBlob || null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        updateData({ videoBlob: blob });
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) { // 2 minutes max
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      setError('Could not access camera and microphone. Please check your permissions.');
      console.error('Error accessing media devices:', err);
    }
  }, [updateData]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [isRecording, stream]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    updateData({ videoBlob: undefined });
    
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }
  }, [updateData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Record Your Video</CardTitle>
          <p className="text-muted-foreground">
            Take your time to record a thoughtful response. You can re-record as many times as needed.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              muted={isRecording}
              playsInline
              className="w-full h-full object-cover"
            />
            
            {!stream && !recordedBlob && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Click "Start Recording" to begin</p>
                </div>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
              </div>
            )}

            {isRecording && recordingTime >= 110 && (
              <div className="absolute bottom-4 left-4 right-4 bg-amber-600 text-white px-3 py-2 rounded text-center">
                <span className="font-medium">10 seconds remaining!</span>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording && !recordedBlob && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 px-8"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {recordedBlob && !isRecording && (
              <div className="flex gap-4">
                <Button
                  onClick={() => videoRef.current?.play()}
                  size="lg"
                  variant="outline"
                  className="px-6"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={resetRecording}
                  size="lg"
                  variant="outline"
                  className="px-6"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Re-record
                </Button>
              </div>
            )}
          </div>

          {recordedBlob && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Recording Complete!</h4>
                  <p className="text-sm text-green-700">
                    Duration: {formatTime(recordingTime)} • Ready for review
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mic className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Quick Reminders:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Address the camera directly, as if talking to a colleague</li>
                  <li>• Feel free to pause and gather your thoughts</li>
                  <li>• Maximum recording time is 2 minutes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onPrev} className="px-8">
              Back
            </Button>
            <Button 
              onClick={onNext}
              disabled={!recordedBlob}
              className="px-8 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            >
              Review & Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordingStep;
