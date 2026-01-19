import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(serviceAccount: any) {
    const jwt = await new jose.SignJWT({
        scope: "https://www.googleapis.com/auth/cloud-platform",
    })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setIssuer(serviceAccount.client_email)
        .setSubject(serviceAccount.client_email)
        .setAudience("https://oauth2.googleapis.com/token")
        .setExpirationTime("1h")
        .sign(await jose.importPKCS8(serviceAccount.private_key, "RS256"));

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(`Auth Error: ${data.error_description || data.error}`);
    return data.access_token;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { record } = await req.json();
        const { user_id, titulo, mensaje } = record;

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get recipient token
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', user_id)
            .single();

        if (profileError || !profile?.fcm_token) {
            console.log(`User ${user_id} has no FCM token saved.`);
            return new Response(JSON.stringify({ message: 'User has no FCM token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get Access Token using jose (native Deno support)
        const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
        const accessToken = await getAccessToken(serviceAccount);

        // Send to FCM
        const fcmResponse = await fetch(
            `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    message: {
                        token: profile.fcm_token,
                        notification: { title: titulo, body: mensaje },
                    },
                }),
            }
        );

        const result = await fcmResponse.json();
        console.log('FCM Result:', result);
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Final Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
