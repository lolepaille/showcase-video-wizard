
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

import AdminHeader from '@/components/admin/AdminHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import AdminDialogs from '@/components/admin/AdminDialogs';
import VideoTrimmer from '@/components/onboarding/VideoTrimmer';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useExportCSV } from '@/components/admin/useExportCSV';
import { useAdminSubmissions } from '@/hooks/useAdminSubmissions';
import { useAdminVideoHandlers } from '@/hooks/useAdminVideoHandlers';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Submissions logic
  const {
    submissions,
    setSubmissions,
    loading,
    error,
    setError,
    filters,
    setFilters,
    filteredAndSortedSubmissions,
  } = useAdminSubmissions(navigate, toast);

  // Editing state
  const [editingSubmission, setEditingSubmission] = useState(null);

  // Video handlers
  const {
    trimmingVideo,
    setTrimmingVideo,
    viewingVideo,
    setViewingVideo,
    handleTrimVideoClick,
    handleViewVideo,
    handleTrimComplete,
  } = useAdminVideoHandlers(toast, setSubmissions, setError);

  // CSV Export
  const exportCSV = useExportCSV(filteredAndSortedSubmissions);

  // CRUD handlers
  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const handleTogglePublish = async (submission) => {
    try {
      const { data: responseData, error: invokeError } = await (await import('@/integrations/supabase/client')).supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: JSON.stringify({
          id: submission.id,
          is_published: !submission.is_published,
        }),
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

  const handleDeleteSubmission = async (submissionId) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    try {
      const { error } = await (await import('@/integrations/supabase/client')).supabase.functions.invoke('admin-submissions', {
        method: 'DELETE',
        body: { id: submissionId },
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

  const handleUpdateSubmission = async (updatedSubmission) => {
    try {
      const { error } = await (await import('@/integrations/supabase/client')).supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: updatedSubmission,
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

  const handleAddSubmission = async (newSubmission) => {
    try {
      const { data, error } = await (await import('@/integrations/supabase/client')).supabase
        .from('submissions')
        .insert(newSubmission)
        .select()
        .single();
      if (error) {
        setError('Failed to add submission');
        return;
      }
      setSubmissions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Submission added successfully",
      });
    } catch (err) {
      setError('Failed to add submission');
    }
  };

  const downloadVideo = async (videoUrl, fileName) => {
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
          showAddForm={false} // dialog logic can be refactored further if needed
          setShowAddForm={()=>{}}
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

        <AdminDialogs
          editingSubmission={editingSubmission}
          setEditingSubmission={setEditingSubmission}
          onUpdateSubmission={handleUpdateSubmission}
          viewingVideo={viewingVideo}
          setViewingVideo={setViewingVideo}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
