
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft } from 'lucide-react';
import { useShowcase } from '@/hooks/useShowcase';
import SubmissionsGrid from '@/components/showcase/SubmissionsGrid';
import VideoDialog from '@/components/showcase/VideoDialog';
import AutoModeIndicator from '@/components/showcase/AutoModeIndicator';

const Showcase = () => {
  const {
    submissions,
    loading,
    error,
    selectedSubmission,
    autoMode,
    groupedSubmissions,
    setSelectedSubmission,
    toggleAutoMode,
    handleProfileClick,
    handleVideoEnd,
    fetchPublishedSubmissions
  } = useShowcase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading showcase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPublishedSubmissions}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              Wall of High Achievers
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Celebrating innovative teaching practices at RMIT
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={toggleAutoMode}
              variant={autoMode ? "default" : "outline"}
              className={autoMode ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {autoMode ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Auto Mode: {autoMode ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        <AutoModeIndicator isActive={autoMode} />

        <SubmissionsGrid 
          groupedSubmissions={groupedSubmissions}
          onProfileClick={handleProfileClick}
        />

        {submissions.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              No profiles published yet
            </h2>
            <p className="text-gray-500">
              Check back soon to see our amazing educators!
            </p>
          </div>
        )}

        <VideoDialog
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onVideoEnd={handleVideoEnd}
        />
      </div>
    </div>
  );
};

export default Showcase;
