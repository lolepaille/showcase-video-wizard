
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ClusterType } from '@/pages/Index';

interface Submission {
  id: string;
  full_name: string;
  email: string;
  title: string;
  cluster: ClusterType;
  profile_picture_url: string | null;
  video_url: string | null;
  notes: any;
  is_published: boolean;
  updated_at: string;
}

const Showcase = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [autoTimeoutId, setAutoTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPublishedSubmissions();
    
    // Set up real-time subscription - listen to ALL submission changes, not just published ones
    const channel = supabase
      .channel('showcase-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'submissions'
          // Remove the filter here so we get all updates
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (autoMode && submissions.length > 0) {
      startAutoMode();
    } else {
      stopAutoMode();
    }
    
    return () => stopAutoMode();
  }, [autoMode, submissions]);

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    console.log('Processing real-time update:', { eventType, newRecord, oldRecord });
    
    setSubmissions(prevSubmissions => {
      switch (eventType) {
        case 'INSERT':
          if (newRecord?.is_published) {
            console.log('Adding new published submission:', newRecord.id);
            // Check if submission already exists to avoid duplicates
            const exists = prevSubmissions.some(s => s.id === newRecord.id);
            if (!exists) {
              return [...prevSubmissions, newRecord];
            }
          }
          return prevSubmissions;
          
        case 'UPDATE':
          console.log('Processing UPDATE event for submission:', newRecord?.id);
          if (newRecord?.is_published) {
            // Add or update published submission
            const existingIndex = prevSubmissions.findIndex(s => s.id === newRecord.id);
            if (existingIndex >= 0) {
              // Update existing submission
              console.log('Updating existing submission with new data:', newRecord);
              const updated = [...prevSubmissions];
              updated[existingIndex] = newRecord;
              return updated;
            } else {
              // Add newly published submission
              console.log('Adding newly published submission:', newRecord.id);
              return [...prevSubmissions, newRecord];
            }
          } else {
            // Remove unpublished submission
            console.log('Removing unpublished submission:', newRecord?.id);
            return prevSubmissions.filter(s => s.id !== newRecord?.id);
          }
          
        case 'DELETE':
          console.log('Removing deleted submission:', oldRecord?.id);
          return prevSubmissions.filter(s => s.id !== oldRecord?.id);
          
        default:
          console.log('Unknown event type:', eventType);
          return prevSubmissions;
      }
    });
  };

  const fetchPublishedSubmissions = async () => {
    try {
      console.log('Fetching published submissions for showcase...');
      
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions via client:', error);
        setError('Failed to load submissions');
        return;
      }

      console.log('Successfully fetched submissions:', data?.length || 0);
      setSubmissions(data || []);
    } catch (err) {
      console.error('Unexpected error fetching submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const startAutoMode = () => {
    if (submissions.length === 0) return;
    
    const randomSubmission = submissions[Math.floor(Math.random() * submissions.length)];
    setSelectedSubmission(randomSubmission);
    
    const timeoutId = setTimeout(() => {
      if (autoMode) {
        setSelectedSubmission(null);
        setTimeout(() => {
          if (autoMode) startAutoMode();
        }, 1000);
      }
    }, 120000 + 2000);
    
    setAutoTimeoutId(timeoutId);
  };

  const stopAutoMode = () => {
    if (autoTimeoutId) {
      clearTimeout(autoTimeoutId);
      setAutoTimeoutId(null);
    }
  };

  const toggleAutoMode = () => {
    setAutoMode(!autoMode);
    if (!autoMode) {
      setSelectedSubmission(null);
    }
  };

  const handleProfileClick = (submission: Submission) => {
    if (autoMode) {
      setAutoMode(false);
    }
    setSelectedSubmission(submission);
  };

  const handleVideoEnd = () => {
    if (autoMode) {
      setSelectedSubmission(null);
      setTimeout(() => {
        if (autoMode) startAutoMode();
      }, 1000);
    } else {
      setSelectedSubmission(null);
    }
  };

  const groupedSubmissions = submissions.reduce((acc, submission) => {
    if (!acc[submission.cluster]) {
      acc[submission.cluster] = [];
    }
    acc[submission.cluster].push(submission);
    return acc;
  }, {} as Record<ClusterType, Submission[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading showcase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPublishedSubmissions}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              Wall of High Achievers
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Celebrating innovative teaching practices at RMIT
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={toggleAutoMode}
              variant={autoMode ? "default" : "outline"}
              className={autoMode ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {autoMode ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Auto Mode: {autoMode ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        {autoMode && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-300 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-green-800">
              <div className="animate-pulse w-2 h-2 bg-green-600 rounded-full"></div>
              Auto Mode Active
            </div>
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedSubmissions).map(([cluster, clusterSubmissions]) => (
            <div key={cluster}>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{cluster}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clusterSubmissions.map((submission) => (
                  <Card 
                    key={submission.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-300 group"
                    onClick={() => handleProfileClick(submission)}
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        {submission.profile_picture_url ? (
                          <img
                            src={submission.profile_picture_url}
                            alt={submission.full_name}
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-105 transition-transform">
                            {submission.full_name.charAt(0)}
                          </div>
                        )}
                        
                        <h3 className="font-semibold text-lg mb-1">{submission.full_name}</h3>
                        {submission.title && (
                          <p className="text-sm text-gray-600 mb-2">{submission.title}</p>
                        )}
                        
                        <Badge variant="outline" className="text-xs">
                          {submission.cluster}
                        </Badge>
                        
                        {submission.video_url && (
                          <div className="mt-4 flex items-center justify-center">
                            <div className="bg-blue-100 text-blue-600 rounded-full p-2 group-hover:bg-blue-200 transition-colors">
                              <Play className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {submissions.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              No profiles published yet
            </h2>
            <p className="text-gray-500">
              Check back soon to see our amazing educators!
            </p>
          </div>
        )}

        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
            {selectedSubmission && (
              <div className="relative w-full h-full bg-black">
                {selectedSubmission.video_url ? (
                  <video
                    src={selectedSubmission.video_url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onEnded={handleVideoEnd}
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      const startTime = selectedSubmission.notes?.startTime;
                      const endTime = selectedSubmission.notes?.endTime;
                      
                      console.log('Video loaded with trim settings:', { 
                        submissionId: selectedSubmission.id,
                        startTime, 
                        endTime,
                        notes: selectedSubmission.notes 
                      });
                      
                      if (startTime !== undefined && startTime > 0) {
                        console.log('Setting video start time to:', startTime);
                        video.currentTime = startTime;
                      }
                      
                      // Handle end time during playback
                      if (endTime !== undefined && endTime > 0) {
                        const handleTimeUpdate = () => {
                          if (video.currentTime >= endTime) {
                            console.log('Video reached end time, stopping playback');
                            video.pause();
                            video.removeEventListener('timeupdate', handleTimeUpdate);
                            handleVideoEnd();
                          }
                        };
                        
                        video.addEventListener('timeupdate', handleTimeUpdate);
                        
                        // Cleanup function
                        return () => {
                          video.removeEventListener('timeupdate', handleTimeUpdate);
                        };
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold mb-2">
                        {selectedSubmission.full_name}
                      </h3>
                      <p className="text-gray-300">Video not available</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-semibold">{selectedSubmission.full_name}</h3>
                    {selectedSubmission.title && (
                      <p className="text-gray-300">{selectedSubmission.title}</p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {selectedSubmission.cluster}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Showcase;
