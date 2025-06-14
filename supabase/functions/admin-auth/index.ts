
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { username, password } = await req.json()

    console.log('Admin login attempt for username:', username)

    // Query admin user with service role to bypass RLS
    const { data: adminUser, error } = await supabaseClient
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !adminUser) {
      console.log('Admin user not found:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Simple password check (in production, use proper bcrypt)
    if (password === 'letmein') {
      console.log('Admin login successful')
      return new Response(
        JSON.stringify({ 
          success: true, 
          admin: { id: adminUser.id, username: adminUser.username }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.log('Invalid password')
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

  } catch (error) {
    console.error('Admin auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
