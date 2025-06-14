import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Trash2, Eye, Download, Users, LogOut, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import FileUploadField from '@/components/onboarding/FileUploadField';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
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
                Submissions ({submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {submission.profile_picture_url && (
                            <img 
                              src={submission.profile_picture_url} 
                              alt={submission.full_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{submission.full_name}</h3>
                            <p className="text-sm text-gray-600">{submission.email}</p>
                            {submission.title && <p className="text-sm text-gray-500">{submission.title}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{submission.cluster}</Badge>
                          <Badge variant={submission.is_published ? "default" : "secondary"}>
                            {submission.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {submission.video_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadVideo(submission.video_url!, `${submission.full_name}_video.webm`)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingSubmission(submission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
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
                        
                        <Button
                          size="sm"
                          variant={submission.is_published ? "secondary" : "default"}
                          onClick={() => handleTogglePublish(submission)}
                        >
                          {submission.is_published ? "Unpublish" : "Publish"}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSubmission(submission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {submissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No submissions yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface AddSubmissionFormProps {
  onSave: (submission: Omit<Submission, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

const AddSubmissionForm: React.FC<AddSubmissionFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    title: '',
    cluster: '' as ClusterType,
    profile_picture_url: '',
    video_url: '',
    notes: {},
    is_published: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.cluster) {
      alert('Please fill in required fields: Full Name, Email, and Cluster');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Cluster *</Label>
        <Select 
          value={formData.cluster} 
          onValueChange={(value: ClusterType) => setFormData(prev => ({ ...prev, cluster: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a cluster" />
          </SelectTrigger>
          <SelectContent>
            {clusters.map((cluster) => (
              <SelectItem key={cluster} value={cluster}>
                {cluster}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FileUploadField
        label="Profile Picture"
        currentUrl={formData.profile_picture_url}
        onUrlChange={(url) => setFormData(prev => ({ ...prev, profile_picture_url: url }))}
        endpoint="upload-profile-picture"
        accept="image/*"
        fileType="Image"
      />

      <FileUploadField
        label="Video"
        currentUrl={formData.video_url}
        onUrlChange={(url) => setFormData(prev => ({ ...prev, video_url: url }))}
        endpoint="upload-video"
        accept="video/*"
        fileType="Video"
      />
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Submission
        </Button>
      </div>
    </form>
  );
};

interface EditSubmissionFormProps {
  submission: Submission;
  onSave: (submission: Submission) => void;
  onCancel: () => void;
}

const EditSubmissionForm: React.FC<EditSubmissionFormProps> = ({ submission, onSave, onCancel }) => {
  const [formData, setFormData] = useState(submission);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Cluster</Label>
        <Select 
          value={formData.cluster} 
          onValueChange={(value: ClusterType) => setFormData(prev => ({ ...prev, cluster: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clusters.map((cluster) => (
              <SelectItem key={cluster} value={cluster}>
                {cluster}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FileUploadField
        label="Profile Picture"
        currentUrl={formData.profile_picture_url || ''}
        onUrlChange={(url) => setFormData(prev => ({ ...prev, profile_picture_url: url }))}
        endpoint="upload-profile-picture"
        accept="image/*"
        fileType="Image"
      />

      <FileUploadField
        label="Video"
        currentUrl={formData.video_url || ''}
        onUrlChange={(url) => setFormData(prev => ({ ...prev, video_url: url }))}
        endpoint="upload-video"
        accept="video/*"
        fileType="Video"
      />
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default AdminDashboard;
