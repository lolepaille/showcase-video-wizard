
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    // Extract payload (start, end, video_url)
    const formData = await req.formData();
    const videoUrl = formData.get('video_url');
    const start = formData.get('start'); // in seconds (as string)
    const end = formData.get('end');     // in seconds (as string)

    if (!videoUrl || !start || !end) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download the video
    const res = await fetch(videoUrl.toString());
    if (!res.ok) throw new Error("Failed to fetch source video file");
    const inputArrayBuffer = await res.arrayBuffer();

    // Dynamically import FFmpeg.wasm (piping via esm.sh for WASM support in Deno)
    const { createFFmpeg, fetchFile } = await import("https://esm.sh/@ffmpeg/ffmpeg@0.12.2");

    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    // Write file to FS
    ffmpeg.FS('writeFile', 'input.webm', new Uint8Array(inputArrayBuffer));

    // Run the trim command
    const trimArgs = [
      '-ss', `${parseFloat(start)}`,
      '-to', `${parseFloat(end)}`,
      '-i', 'input.webm',
      '-c', 'copy',
      'output.webm'
    ];
    await ffmpeg.run(...trimArgs);

    const output = ffmpeg.FS('readFile', 'output.webm');

    return new Response(output.buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/webm',
        'Content-Disposition': 'attachment; filename=trimmed.webm',
      }
    });
  } catch (err) {
    console.error("Trim video function error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
