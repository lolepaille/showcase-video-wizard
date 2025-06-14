
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ClusterType } from '@/pages/Index';

export interface Submission {
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

export const useShowcase = () => {
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
      console.log("[AutoMode] Auto Mode ON. Starting sequence...");
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
    if (submissions.length === 0) {
      console.log("[AutoMode] No submissions to display.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * submissions.length);
    const randomSubmission = submissions[randomIndex];
    setSelectedSubmission(randomSubmission);
    console.log("[AutoMode] Showing submission:", randomSubmission.full_name, randomSubmission.id);

    // 2 mins + 2s
    const timeoutId = setTimeout(() => {
      if (autoMode) {
        console.log("[AutoMode] Timeout reached, moving to next submission...");
        setSelectedSubmission(null);
        setTimeout(() => {
          if (autoMode) {
            console.log("[AutoMode] Triggering next random submission after video/timeout.");
            startAutoMode();
          }
        }, 1000);
      }
    }, 120000 + 2000);

    setAutoTimeoutId(timeoutId);
  };

  const stopAutoMode = () => {
    if (autoTimeoutId) {
      clearTimeout(autoTimeoutId);
      setAutoTimeoutId(null);
      console.log("[AutoMode] Auto Mode stopped and timeout cleared.");
    }
  };

  const toggleAutoMode = () => {
    setAutoMode(!autoMode);
    if (!autoMode) {
      console.log("[AutoMode] Turning Auto Mode off, closing submission dialog.");
      setSelectedSubmission(null);
    } else {
      console.log("[AutoMode] Turning Auto Mode ON.");
    }
  };

  const handleProfileClick = (submission: Submission) => {
    if (autoMode) {
      setAutoMode(false);
      console.log("[AutoMode] Manual profile click, disabling Auto Mode.");
    }
    setSelectedSubmission(submission);
  };

  const handleVideoEnd = () => {
    console.log("[AutoMode] Video finished playing.");
    if (autoMode) {
      setSelectedSubmission(null);
      setTimeout(() => {
        if (autoMode) {
          console.log("[AutoMode] Triggering next random submission after video end.");
          startAutoMode();
        }
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

  return {
    submissions,
    loading,
    error,
    selectedSubmission,
    autoMode,
    groupedSubmissions,
    setSelectedSubmission,
    toggleAutoMode,
    handleProfileClick,
    handleVideoEnd,
    fetchPublishedSubmissions
  };
};
