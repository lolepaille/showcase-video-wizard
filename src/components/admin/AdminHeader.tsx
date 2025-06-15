
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddSubmissionForm } from './SubmissionForms';
import { useExportCSV } from './useExportCSV';

interface AdminHeaderProps {
  onViewShowcase: () => void;
  onExportCSV: () => void;
  onLogout: () => void;
  showAddForm: boolean;
  setShowAddForm: (open: boolean) => void;
  onAddSubmission: (submission: any) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onViewShowcase,
  onExportCSV,
  onLogout,
  showAddForm,
  setShowAddForm,
  onAddSubmission
}) => (
  <div className="flex justify-between items-center mb-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600 mt-2">Manage teacher submissions and showcase content</p>
    </div>
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={onViewShowcase}>
        <Eye className="h-4 w-4 mr-2" />
        View Showcase
      </Button>
      <Button variant="outline" onClick={onExportCSV}>
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
            onSave={onAddSubmission}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>
      <Button variant="outline" onClick={onLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  </div>
);

export default AdminHeader;
