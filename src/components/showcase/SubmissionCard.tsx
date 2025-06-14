
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import type { Submission } from '@/hooks/useShowcase';

interface SubmissionCardProps {
  submission: Submission;
  onClick: (submission: Submission) => void;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-300 group"
      onClick={() => onClick(submission)}
    >
      <CardContent className="p-6">
        <div className="text-center">
          {submission.profile_picture_url ? (
            <img
              src={submission.profile_picture_url}
              alt={submission.full_name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-105 transition-transform">
              {submission.full_name.charAt(0)}
            </div>
          )}
          
          <h3 className="font-semibold text-lg mb-1">{submission.full_name}</h3>
          {submission.title && (
            <p className="text-sm text-gray-600 mb-2">{submission.title}</p>
          )}
          
          <Badge variant="outline" className="text-xs">
            {submission.cluster}
          </Badge>
          
          {submission.video_url && (
            <div className="mt-4 flex items-center justify-center">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 group-hover:bg-blue-200 transition-colors">
                <Play className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmissionCard;
