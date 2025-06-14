
import React from 'react';
import SubmissionCard from './SubmissionCard';
import type { Submission } from '@/hooks/useShowcase';
import type { ClusterType } from '@/pages/Index';

interface SubmissionsGridProps {
  groupedSubmissions: Record<ClusterType, Submission[]>;
  onProfileClick: (submission: Submission) => void;
}

const SubmissionsGrid: React.FC<SubmissionsGridProps> = ({ 
  groupedSubmissions, 
  onProfileClick 
}) => {
  return (
    <div className="space-y-8">
      {Object.entries(groupedSubmissions).map(([cluster, clusterSubmissions]) => (
        <div key={cluster}>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">{cluster}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clusterSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onClick={onProfileClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubmissionsGrid;
