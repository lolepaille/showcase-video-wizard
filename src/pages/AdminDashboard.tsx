
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { ClusterType } from '@/pages/Index';
import { AddSubmissionForm, EditSubmissionForm, Submission } from '@/components/admin/SubmissionForms';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import VideoTrimmer from '@/components/onboarding/VideoTrimmer';
import VideoViewerDialog from '@/components/admin/VideoViewerDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useExportCSV } from '@/components/admin/useExportCSV';

import type { FiltersState, SortField } from '@/components/admin/SubmissionsFilters';

const clusters: ClusterType[] = [
  'Future Tech',
  'Built Environment & Sustainability',
  'Creative Industries',
  'Business & Enterprise',
  'Social Care & Health'
];

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [trimmingVideo, setTrimmingVideo] = useState<Submission | null>(null);
  const [viewingVideo, setViewingVideo] = useState<Submission | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  // Filters and sorting state
  const [filters, setFilters] = useState<FiltersState>({
    searchTerm: '',
    sortField: 'created_at',
    sortDirection: 'desc'
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin');
      return;
    }
    fetchSubmissions();
    // eslint-disable-next-line
  }, [navigate]);

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(submission =>
        submission.full_name.toLowerCase().includes(searchLower) ||
        submission.email.toLowerCase().includes(searchLower) ||
        (submission.title && submission.title.toLowerCase().includes(searchLower)) ||
        submission.cluster.toLowerCase().includes(searchLower)
      );
    }
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      switch (filters.sortField) {
        case 'full_name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'cluster':
          aValue = a.cluster.toLowerCase();
          bValue = b.cluster.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      if (aValue < bValue) {
        return filters.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return filters.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return result;
  }, [submissions, filters]);

  const handleSort = (field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-submissions', {
        method: 'GET'
      });
      if (error) {
        setError('Failed to fetch submissions');
        return;
      }
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const handleTogglePublish = async (submission: Submission) => {
    try {
      const { data: responseData, error: invokeError } = await supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: JSON.stringify({
          id: submission.id,
          is_published: !submission.is_published
        })
      });
      if (invokeError) {
        const errorMessage =
          (invokeError.data && invokeError.data.error) ||
          invokeError.message || 'Failed to update submission status.';
        setError(errorMessage);
        toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      setSubmissions(prev =>
        prev.map(s => s.id === submission.id ? { ...s, is_published: !s.is_published, updated_at: responseData?.submission?.updated_at || new Date().toISOString() } : s)
      );
      toast({
        title: "Success",
        description: `Submission ${!submission.is_published ? 'published' : 'unpublished'} successfully.`,
      });
      setError('');
    } catch (err) {
      setError('An unexpected error occurred while toggling publish status.');
      toast({
        title: "Error",
        description: 'An unexpected error occurred while toggling publish status.',
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    try {
      const { error } = await supabase.functions.invoke('admin-submissions', {
        method: 'DELETE',
        body: { id: submissionId }
      });
      if (error) {
        setError('Failed to delete submission');
        return;
      }
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
    } catch (err) {
      setError('Failed to delete submission');
    }
  };

  const handleUpdateSubmission = async (updatedSubmission: Submission) => {
    try {
      const { error } = await supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: updatedSubmission
      });
      if (error) {
        setError('Failed to update submission');
        return;
      }
      setSubmissions(prev =>
        prev.map(s => s.id === updatedSubmission.id ? updatedSubmission : s)
      );
      setEditingSubmission(null);
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
    } catch (err) {
      setError('Failed to update submission');
    }
  };

  const handleAddSubmission = async (newSubmission: Omit<Submission, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert(newSubmission)
        .select()
        .single();
      if (error) {
        setError('Failed to add submission');
        return;
      }
      setSubmissions(prev => [data, ...prev]);
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Submission added successfully",
      });
    } catch (err) {
      setError('Failed to add submission');
    }
  };

  const downloadVideo = async (videoUrl: string, fileName: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download video');
    }
  };

  const handleTrimComplete = async (videoUrl: string, startTime?: number, endTime?: number) => {
    if (!trimmingVideo) return;
    try {
      const { error: updateError } = await supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: JSON.stringify({
          id: trimmingVideo.id,
          video_url: videoUrl,
          notes: {
            ...trimmingVideo.notes,
            startTime,
            endTime
          }
        })
      });
      if (updateError) {
        throw new Error('Failed to update submission with trim times');
      }
      setSubmissions(prev =>
        prev.map(s => s.id === trimmingVideo.id ? {
          ...s,
          video_url: videoUrl,
          notes: {
            ...s.notes,
            startTime,
            endTime
          }
        } : s)
      );
      toast({
        title: "Success",
        description: "Video playback times set successfully",
      });
      setTrimmingVideo(null);
    } catch (err) {
      setError('Failed to save video playback times');
    }
  };

  const handleTrimVideoClick = async (submission: Submission) => {
    if (!submission.video_url) {
      setError('No video URL found for this submission');
      return;
    }
    setTrimmingVideo(submission);
  };

  const handleViewVideo = (submission: Submission) => {
    setViewingVideo(submission);
  };

  const exportCSV = useExportCSV(filteredAndSortedSubmissions);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (trimmingVideo) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <VideoTrimmer
            videoUrl={trimmingVideo.video_url}
            onTrimComplete={handleTrimComplete}
            onCancel={() => setTrimmingVideo(null)}
            title={`Set Playback Times: ${trimmingVideo.full_name}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader
          onViewShowcase={() => navigate('/showcase')}
          onExportCSV={exportCSV}
          onLogout={handleLogout}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          onAddSubmission={handleAddSubmission}
        />

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <AdminTableCard
          filteredAndSortedSubmissions={filteredAndSortedSubmissions}
          filters={filters}
          setFilters={setFilters}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          onSort={handleSort}
          onEdit={setEditingSubmission}
          onDelete={handleDeleteSubmission}
          onTogglePublish={handleTogglePublish}
          onTrimVideo={handleTrimVideoClick}
          onDownloadVideo={downloadVideo}
          onViewVideo={handleViewVideo}
        />

        {/* Edit Dialog */}
        <Dialog open={!!editingSubmission} onOpenChange={() => setEditingSubmission(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Submission</DialogTitle>
            </DialogHeader>
            {editingSubmission && (
              <EditSubmissionForm
                submission={editingSubmission}
                onSave={handleUpdateSubmission}
                onCancel={() => setEditingSubmission(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Video Viewer Dialog */}
        <VideoViewerDialog
          isOpen={!!viewingVideo}
          onClose={() => setViewingVideo(null)}
          videoUrl={viewingVideo?.video_url || null}
          submissionName={viewingVideo?.full_name || ''}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
