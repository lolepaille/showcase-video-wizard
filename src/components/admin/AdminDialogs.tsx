
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditSubmissionForm, Submission } from './SubmissionForms';
import VideoViewerDialog from './VideoViewerDialog';

interface AdminDialogsProps {
  editingSubmission: Submission | null;
  setEditingSubmission: (s: Submission | null) => void;
  onUpdateSubmission: (updated: Submission) => void;

  viewingVideo: Submission | null;
  setViewingVideo: (s: Submission | null) => void;
}

const AdminDialogs: React.FC<AdminDialogsProps> = ({
  editingSubmission,
  setEditingSubmission,
  onUpdateSubmission,
  viewingVideo,
  setViewingVideo,
}) => (
  <>
    {/* Edit Dialog */}
    <Dialog open={!!editingSubmission} onOpenChange={() => setEditingSubmission(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Submission</DialogTitle>
        </DialogHeader>
        {editingSubmission && (
          <EditSubmissionForm
            submission={editingSubmission}
            onSave={onUpdateSubmission}
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
  </>
);

export default AdminDialogs;
