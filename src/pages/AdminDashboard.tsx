import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, LogOut, Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import FileUploadField from '@/components/onboarding/FileUploadField';
import VideoTrimmer from '@/components/onboarding/VideoTrimmer';
import SubmissionsFilters, { type FiltersState, type SortField } from '@/components/admin/SubmissionsFilters';
import SubmissionsTable from '@/components/admin/SubmissionsTable';
import VideoViewerDialog from '@/components/admin/VideoViewerDialog';
import type { ClusterType } from '@/pages/Index';
import { AddSubmissionForm, EditSubmissionForm } from '@/components/admin/SubmissionForms';

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
  created_at: string;
}

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
  }, [navigate]);

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(submission => 
        submission.full_name.toLowerCase().includes(searchLower) ||
        submission.email.toLowerCase().includes(searchLower) ||
        (submission.title && submission.title.toLowerCase().includes(searchLower)) ||
        submission.cluster.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
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
      console.error('Error fetching submissions:', err);
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
      console.log('Attempting to toggle publish status for submission:', submission.id);
      
      const { data: responseData, error: invokeError } = await supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: JSON.stringify({
          id: submission.id,
          is_published: !submission.is_published
        })
      });

      console.log('Response from admin-submissions:', { responseData, invokeError });

      if (invokeError) {
        console.error('Error invoking admin-submissions for toggle publish:', invokeError);
        const errorMessage = 
          (invokeError.data && invokeError.data.error) || 
          invokeError.message || 
          'Failed to update submission status.';
        
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
      console.error('Network/unexpected error during toggle publish:', err);
      let message = 'An unexpected error occurred while toggling publish status.';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-submissions', {
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
      console.error('Error deleting submission:', err);
      setError('Failed to delete submission');
    }
  };

  const handleUpdateSubmission = async (updatedSubmission: Submission) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-submissions', {
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
      console.error('Error updating submission:', err);
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
      console.error('Error adding submission:', err);
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
      console.error('Error downloading video:', err);
      setError('Failed to download video');
    }
  };

  const handleTrimComplete = async (videoUrl: string, startTime?: number, endTime?: number) => {
    if (!trimmingVideo) return;
    
    try {
      console.log('Updating submission with trim times:', { videoUrl, startTime, endTime });
      
      // Update the submission record with the original video URL and trim times
      const { error: updateError } = await supabase.functions.invoke('admin-submissions', {
        method: 'PUT',
        body: JSON.stringify({
          id: trimmingVideo.id,
          video_url: videoUrl,
          // Store trim times in notes for now - we could add dedicated columns later
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
      
      // Update local state
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
      console.error('Error saving trim times:', err);
      setError('Failed to save video playback times');
    }
  };

  const handleTrimVideoClick = async (submission: Submission) => {
    if (!submission.video_url) {
      setError('No video URL found for this submission');
      return;
    }

    // No need to download to blob, just pass the URL for server-side trimming
    setTrimmingVideo(submission);
  };

  const handleViewVideo = (submission: Submission) => {
    setViewingVideo(submission);
  };

  const exportSubmissionsToCSV = () => {
    // Only export fields useful for data consumption.
    const columns = [
      "id", "full_name", "email", "title", "cluster", "profile_picture_url", "video_url",
      "is_published", "created_at"
    ];

    // CSV header
    const csvHeader = columns.join(",") + "\n";

    // Data rows
    const csvRows = filteredAndSortedSubmissions.map(sub => 
      columns.map(field => {
        let val = sub[field as keyof typeof sub];
        // Stringify and clean value
        if (typeof val === "string") {
          // Escape quotes and commas in strings
          val = '"' + val.replace(/"/g, '""') + '"';
        } else if (typeof val === "boolean") {
          val = val ? "TRUE" : "FALSE";
        } else if (val === null || val === undefined) {
          val = "";
        }
        return val;
      }).join(",")
    );
    
    const csvContent = csvHeader + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
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

  // Show video trimmer if a video is selected for trimming
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage teacher submissions and showcase content</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/showcase')}>
              <Eye className="h-4 w-4 mr-2" />
              View Showcase
            </Button>
            {/* New Export CSV Button */}
            <Button variant="outline" onClick={exportSubmissionsToCSV}>
              Export CSV
            </Button>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Submission</DialogTitle>
                </DialogHeader>
                <AddSubmissionForm 
                  onSave={handleAddSubmission}
                  onCancel={() => setShowAddForm(false)}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Submissions ({filteredAndSortedSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionsFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
              
              <SubmissionsTable
                submissions={filteredAndSortedSubmissions}
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
            </CardContent>
          </Card>
        </div>

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
