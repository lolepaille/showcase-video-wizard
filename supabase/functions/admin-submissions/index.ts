
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  console.log(`${req.method} request received for /admin-submissions`);
  
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const method = req.method;

    if (method === 'GET') {
      console.log('Fetching all submissions');
      
      const { data: submissions, error } = await supabaseClient
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch submissions' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      console.log(`Successfully fetched ${submissions?.length || 0} submissions`);
      
      return new Response(
        JSON.stringify({ submissions }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (method === 'PUT') {
      console.log('Processing PUT request for submission update');
      
      let body;
      try {
        const bodyText = await req.text();
        console.log('Raw request body:', bodyText);
        
        if (!bodyText) {
          throw new Error('Empty request body');
        }
        
        body = JSON.parse(bodyText);
        console.log('Parsed request body:', JSON.stringify(body, null, 2));
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { id, ...updateFields } = body;
      if (!id) {
        console.error('No submission ID provided for update');
        return new Response(
          JSON.stringify({ error: 'Submission ID is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Only allow specific fields to be updated
      const allowedFields = [
        'full_name', 'email', 'title', 'cluster',
        'profile_picture_url', 'video_url', 'notes', 'is_published'
      ];
      
      const updateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(updateFields)) {
        if (allowedFields.includes(key)) {
          updateData[key] = value;
        } else {
          console.warn(`Skipping non-allowed field: ${key}`);
        }
      }

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      console.log(`Updating submission ID: ${id} with data:`, JSON.stringify(updateData, null, 2));
      
      const { data, error: supabaseError } = await supabaseClient
        .from('submissions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        console.error(`Supabase error updating submission ID ${id}:`, JSON.stringify(supabaseError, null, 2));
        return new Response(
          JSON.stringify({ 
            error: `Failed to update submission: ${supabaseError.message}`, 
            details: supabaseError 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      console.log(`Successfully updated submission ID ${id}:`, JSON.stringify(data, null, 2));

      return new Response(
        JSON.stringify({ submission: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (method === 'DELETE') {
      console.log('Processing DELETE request');
      
      let body;
      try {
        const bodyText = await req.text();
        body = JSON.parse(bodyText);
      } catch (parseError) {
        console.error('Error parsing request body for DELETE:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      const { id } = body;
      
      if (!id) {
        console.error('No submission ID provided for deletion');
        return new Response(
          JSON.stringify({ error: 'Submission ID is required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      console.log('Deleting submission:', id);
      
      const { error } = await supabaseClient
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting submission:', error);
        return new Response(
          JSON.stringify({ error: `Failed to delete submission: ${error.message}` }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      console.log('Successfully deleted submission:', id);

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Method not allowed: ${method} for /admin-submissions`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );

  } catch (error) {
    console.error('Unexpected error in admin-submissions function:', error, error?.stack || '');
    return new Response(
      JSON.stringify({
        error: `Internal server error: ${error?.message}`,
        details: error?.stack || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
