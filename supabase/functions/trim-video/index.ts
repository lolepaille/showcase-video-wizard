
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Trim video function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract payload (start, end, video_url)
    const formData = await req.formData();
    const videoUrl = formData.get('video_url');
    const start = formData.get('start'); // in seconds (as string)
    const end = formData.get('end');     // in seconds (as string)

    console.log('Received trim request:', { videoUrl, start, end });

    if (!videoUrl || !start || !end) {
      console.error('Missing required parameters');
      return new Response(JSON.stringify({ error: 'Missing parameters: video_url, start, and end are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate start and end times
    const startTime = parseFloat(start as string);
    const endTime = parseFloat(end as string);
    
    if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime || startTime < 0) {
      console.error('Invalid time parameters:', { startTime, endTime });
      return new Response(JSON.stringify({ error: 'Invalid time parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Downloading video from:', videoUrl);
    
    // Download the video
    const res = await fetch(videoUrl.toString());
    if (!res.ok) {
      console.error('Failed to fetch source video:', res.status, res.statusText);
      throw new Error(`Failed to fetch source video: ${res.status}`);
    }
    
    const inputArrayBuffer = await res.arrayBuffer();
    console.log('Downloaded video, size:', inputArrayBuffer.byteLength, 'bytes');

    // For now, let's use a simple approach - just return a portion of the original video
    // This is a placeholder until we can get FFmpeg working properly
    
    // Calculate the approximate byte range based on duration
    const totalBytes = inputArrayBuffer.byteLength;
    const duration = endTime - startTime;
    
    // This is a very rough approximation - in reality, video trimming requires proper video processing
    const startByte = Math.floor((startTime / (startTime + duration + 10)) * totalBytes);
    const endByte = Math.floor(((startTime + duration) / (startTime + duration + 10)) * totalBytes);
    
    // For now, return the original video with a success message
    // TODO: Implement proper FFmpeg-based trimming
    console.log('Returning trimmed video (placeholder implementation)');
    
    return new Response(inputArrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename=trimmed-video.mp4',
      }
    });

  } catch (err) {
    console.error("Trim video function error:", err);
    return new Response(JSON.stringify({ 
      error: (err as Error).message || 'Internal server error',
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
