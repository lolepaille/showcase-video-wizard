
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import SubmissionsFilters, { FiltersState, SortField } from './SubmissionsFilters';
import SubmissionsTable from './SubmissionsTable';

import type { Submission } from './SubmissionForms';

interface AdminTableCardProps {
  filteredAndSortedSubmissions: Submission[];
  filters: FiltersState;
  setFilters: (filters: FiltersState) => void;
  sortField: string;
  sortDirection: string;
  onSort: (field: SortField) => void;
  onEdit: (submission: Submission) => void;
  onDelete: (submissionId: string) => void;
  onTogglePublish: (submission: Submission) => void;
  onTrimVideo: (submission: Submission) => void;
  onDownloadVideo: (videoUrl: string, fileName: string) => void;
  onViewVideo: (submission: Submission) => void;
}

const AdminTableCard: React.FC<AdminTableCardProps> = ({
  filteredAndSortedSubmissions,
  filters,
  setFilters,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onTogglePublish,
  onTrimVideo,
  onDownloadVideo,
  onViewVideo
}) => (
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
          sortField={sortField as any}
          sortDirection={sortDirection as any}
          onSort={onSort}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePublish={onTogglePublish}
          onTrimVideo={onTrimVideo}
          onDownloadVideo={onDownloadVideo}
          onViewVideo={onViewVideo}
        />
      </CardContent>
    </Card>
  </div>
);

export default AdminTableCard;
