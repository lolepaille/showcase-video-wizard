
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`${req.method} request received`)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const method = req.method

    if (method === 'GET') {
      console.log('Fetching all submissions')
      
      const { data: submissions, error } = await supabaseClient
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching submissions:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch submissions' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      console.log(`Successfully fetched ${submissions?.length || 0} submissions`)
      
      return new Response(
        JSON.stringify({ submissions }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (method === 'PUT') {
      console.log('Processing PUT request for submission update')
      
      let body
      try {
        body = await req.json()
        console.log('Request body parsed:', JSON.stringify(body, null, 2))
      } catch (parseError) {
        console.error('Error parsing request body:', parseError)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      
      const { id, ...updates } = body
      
      if (!id) {
        console.error('No submission ID provided for update')
        return new Response(
          JSON.stringify({ error: 'Submission ID is required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      console.log('Updating submission:', id, 'with updates:', updates)

      // Add updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabaseClient
        .from('submissions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error updating submission:', error)
        return new Response(
          JSON.stringify({ error: `Failed to update submission: ${error.message}` }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      console.log('Successfully updated submission:', data)

      return new Response(
        JSON.stringify({ submission: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (method === 'DELETE') {
      console.log('Processing DELETE request')
      
      let body
      try {
        body = await req.json()
      } catch (parseError) {
        console.error('Error parsing request body for DELETE:', parseError)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      
      const { id } = body
      
      if (!id) {
        console.error('No submission ID provided for deletion')
        return new Response(
          JSON.stringify({ error: 'Submission ID is required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      
      console.log('Deleting submission:', id)
      
      const { error } = await supabaseClient
        .from('submissions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting submission:', error)
        return new Response(
          JSON.stringify({ error: `Failed to delete submission: ${error.message}` }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      console.log('Successfully deleted submission:', id)

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Method not allowed:', method)
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin-submissions function:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
