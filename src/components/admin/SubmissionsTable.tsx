
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Download, Scissors, ArrowUpDown } from 'lucide-react';
import type { SortField, SortDirection } from './SubmissionsFilters';

interface Submission {
  id: string;
  full_name: string;
  email: string;
  title: string;
  cluster: string;
  profile_picture_url: string | null;
  video_url: string | null;
  notes: any;
  is_published: boolean;
  created_at: string;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (submission: Submission) => void;
  onDelete: (submissionId: string) => void;
  onTogglePublish: (submission: Submission) => void;
  onTrimVideo: (submission: Submission) => void;
  onDownloadVideo: (videoUrl: string, fileName: string) => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  submissions,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onTogglePublish,
  onTrimVideo,
  onDownloadVideo
}) => {
  const getSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('full_name')}
            >
              <div className="flex items-center gap-2">
                Name
                {getSortIcon('full_name')}
              </div>
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Title</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('cluster')}
            >
              <div className="flex items-center gap-2">
                Cluster
                {getSortIcon('cluster')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('created_at')}
            >
              <div className="flex items-center gap-2">
                Created
                {getSortIcon('created_at')}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>
                {submission.profile_picture_url && (
                  <img 
                    src={submission.profile_picture_url} 
                    alt={submission.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
              </TableCell>
              <TableCell className="font-medium">{submission.full_name}</TableCell>
              <TableCell className="text-sm text-gray-600">{submission.email}</TableCell>
              <TableCell className="text-sm">{submission.title || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline">{submission.cluster}</Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(submission.created_at)}
              </TableCell>
              <TableCell>
                <Badge variant={submission.is_published ? "default" : "secondary"}>
                  {submission.is_published ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {submission.video_url && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadVideo(submission.video_url!, `${submission.full_name}_video.webm`)}
                        title="Download video"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTrimVideo(submission)}
                        title="Trim video"
                      >
                        <Scissors className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEdit(submission)}
                    title="Edit submission"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={submission.is_published ? "secondary" : "default"}
                    onClick={() => onTogglePublish(submission)}
                    title={submission.is_published ? "Unpublish" : "Publish"}
                  >
                    {submission.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(submission.id)}
                    title="Delete submission"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {submissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No submissions found
        </div>
      )}
    </div>
  );
};

export default SubmissionsTable;
