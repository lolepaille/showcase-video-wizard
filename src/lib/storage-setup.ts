
import { supabase } from '@/integrations/supabase/client';

export const ensureStorageBuckets = async () => {
  try {
    // Just verify buckets exist (they should be created via SQL migration)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketNames = buckets?.map(bucket => bucket.name) || [];
    console.log('Available storage buckets:', bucketNames);
    
    // Verify required buckets exist
    const requiredBuckets = ['profile-pictures', 'videos'];
    const missingBuckets = requiredBuckets.filter(bucket => !bucketNames.includes(bucket));
    
    if (missingBuckets.length > 0) {
      console.warn('Missing storage buckets:', missingBuckets);
      console.warn('These should be created via SQL migration');
    } else {
      console.log('All required storage buckets are available');
    }
  } catch (error) {
    console.error('Error checking storage buckets:', error);
  }
};
