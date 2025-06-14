
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Play, Square, RotateCcw, CheckCircle2, Camera, Mic, Monitor, Presentation } from 'lucide-react';
import type { SubmissionData } from '@/pages/Index';

interface RecordingStepProps {
  onNext: () => void;
  onPrev: () => void;
  data: SubmissionData;
  updateData: (data: Partial<SubmissionData>) => void;
}

type RecordingMode = 'camera' | 'screen' | 'both';

const RecordingStep: React.FC<RecordingStepProps> = ({ onNext, onPrev, data, updateData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(data.videoBlob || null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      let finalStream: MediaStream | null = null;

      if (recordingMode === 'camera') {
        // Camera only recording
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
        
        setCameraStream(mediaStream);
        finalStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } else if (recordingMode === 'screen') {
        // Screen only recording
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        });
        
        setScreenStream(displayStream);
        finalStream = displayStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = displayStream;
        }
      } else if (recordingMode === 'both') {
        // Picture-in-picture recording (screen + camera)
        const [displayStream, cameraStreamLocal] = await Promise.all([
          navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: true
          }),
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 320 },
              height: { ideal: 240 },
              facingMode: 'user'
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          })
        ]);

        setScreenStream(displayStream);
        setCameraStream(cameraStreamLocal);

        // Set up canvas for compositing
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.width = 1920;
        canvas.height = 1080;

        // Create video elements for compositing
        const screenVideo = document.createElement('video');
        const cameraVideo = document.createElement('video');
        
        screenVideo.srcObject = displayStream;
        cameraVideo.srcObject = cameraStreamLocal;
        
        await Promise.all([
          new Promise(resolve => { screenVideo.onloadedmetadata = resolve; screenVideo.play(); }),
          new Promise(resolve => { cameraVideo.onloadedmetadata = resolve; cameraVideo.play(); })
        ]);

        // Set up PiP preview
        if (videoRef.current) {
          videoRef.current.srcObject = displayStream;
        }
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = cameraStreamLocal;
        }

        // Composite the streams
        const drawFrame = () => {
          // Draw screen capture
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          
          // Draw camera in corner (320x240 at bottom-right with 20px margin)
          const pipWidth = 320;
          const pipHeight = 240;
          const margin = 20;
          
          ctx.drawImage(
            cameraVideo,
            canvas.width - pipWidth - margin,
            canvas.height - pipHeight - margin,
            pipWidth,
            pipHeight
          );
          
          if (isRecording) {
            animationRef.current = requestAnimationFrame(drawFrame);
          }
        };
        
        drawFrame();
        finalStream = canvas.captureStream(30);
        
        // Add audio from both streams
        const audioTracks = [
          ...displayStream.getAudioTracks(),
          ...cameraStreamLocal.getAudioTracks()
        ];
        audioTracks.forEach(track => finalStream!.addTrack(track));
      }

      if (!finalStream) return;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(finalStream, { mimeType });

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
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = null;
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
      setError('Could not access camera and/or screen. Please check your permissions.');
      console.error('Error accessing media devices:', err);
    }
  }, [updateData, recordingMode, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Stop all streams
      [cameraStream, screenStream].forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
      
      setCameraStream(null);
      setScreenStream(null);
    }
  }, [isRecording, cameraStream, screenStream]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    updateData({ videoBlob: undefined });
    
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = null;
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
            Choose your recording mode and create a thoughtful response. Perfect for presentations or face-to-face communication.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Recording Mode Selection */}
          {!isRecording && !recordedBlob && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Recording Mode</h3>
              <RadioGroup 
                value={recordingMode} 
                onValueChange={(value) => setRecordingMode(value as RecordingMode)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="camera" id="camera" />
                  <Label htmlFor="camera" className="flex items-center gap-2 cursor-pointer">
                    <Camera className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Camera Only</div>
                      <div className="text-sm text-muted-foreground">Traditional video recording</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="screen" id="screen" />
                  <Label htmlFor="screen" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Screen Only</div>
                      <div className="text-sm text-muted-foreground">Record your screen/presentation</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                    <Presentation className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Screen + Camera</div>
                      <div className="text-sm text-muted-foreground">Presentation with you in corner</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Video Preview Area */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              muted={isRecording}
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Picture-in-Picture overlay for camera when recording both */}
            {recordingMode === 'both' && (cameraStream || isRecording) && (
              <div className="absolute bottom-4 right-4 w-32 h-24 border-2 border-white rounded-lg overflow-hidden">
                <video
                  ref={pipVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {!cameraStream && !screenStream && !recordedBlob && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  {recordingMode === 'camera' && <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />}
                  {recordingMode === 'screen' && <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />}
                  {recordingMode === 'both' && <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />}
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

          {/* Hidden canvas for compositing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Recording Controls */}
          <div className="flex justify-center gap-4">
            {!isRecording && !recordedBlob && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                {recordingMode === 'camera' && <Camera className="h-5 w-5 mr-2" />}
                {recordingMode === 'screen' && <Monitor className="h-5 w-5 mr-2" />}
                {recordingMode === 'both' && <Presentation className="h-5 w-5 mr-2" />}
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
                <h4 className="font-medium text-blue-800 mb-2">Recording Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Camera:</strong> Traditional face-to-face recording</li>
                  <li>• <strong>Screen:</strong> Perfect for presentations and demos</li>
                  <li>• <strong>Both:</strong> Present with your face in the corner</li>
                  <li>• Maximum recording time is 2 minutes</li>
                  <li>• Your video can be trimmed by admins during review</li>
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
