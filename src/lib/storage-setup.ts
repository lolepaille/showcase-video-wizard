
import { supabase } from '@/integrations/supabase/client';

export const ensureStorageBuckets = async () => {
  try {
    // Check if buckets exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketNames = buckets?.map(bucket => bucket.name) || [];
    
    // Create profile-pictures bucket if it doesn't exist
    if (!bucketNames.includes('profile-pictures')) {
      const { error: profileError } = await supabase.storage.createBucket('profile-pictures', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });
      
      if (profileError) {
        console.error('Error creating profile-pictures bucket:', profileError);
      } else {
        console.log('Created profile-pictures bucket');
      }
    }

    // Create videos bucket if it doesn't exist
    if (!bucketNames.includes('videos')) {
      const { error: videoError } = await supabase.storage.createBucket('videos', {
        public: true,
        allowedMimeTypes: ['video/webm', 'video/mp4', 'video/quicktime'],
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
      });
      
      if (videoError) {
        console.error('Error creating videos bucket:', videoError);
      } else {
        console.log('Created videos bucket');
      }
    }
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
  }
};
