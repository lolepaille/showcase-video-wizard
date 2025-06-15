
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileUploadField from '@/components/onboarding/FileUploadField';
import type { ClusterType } from '@/pages/Index';

interface AddSubmissionFormProps {
  onSave: (submission: Omit<Submission, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}
interface EditSubmissionFormProps {
  submission: Submission;
  onSave: (submission: Submission) => void;
  onCancel: () => void;
}

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
  created_at: string;
}

const clusters: ClusterType[] = [
  'Future Tech',
  'Built Environment & Sustainability',
  'Creative Industries',
  'Business & Enterprise',
  'Social Care & Health'
];

// Add Submission Form
export const AddSubmissionForm: React.FC<AddSubmissionFormProps> = ({ onSave, onCancel }) => {
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

// Edit Submission Form
export const EditSubmissionForm: React.FC<EditSubmissionFormProps> = ({ submission, onSave, onCancel }) => {
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
