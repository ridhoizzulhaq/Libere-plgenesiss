// Supabase Edge Function: proxy ATProto requests to avoid browser CORS
// Deploy: supabase functions deploy hypercerts-proxy

const PDS_HOST = Deno.env.get('HYPER_PDS_HOST') ?? 'https://certified.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { path, method, body, headers: reqHeaders, pdsHost: reqPdsHost } = await req.json();

    const targetHost = reqPdsHost ?? PDS_HOST;
    const url = `${targetHost}${path}`;
    const upstreamHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (reqHeaders?.authorization) {
      upstreamHeaders['Authorization'] = reqHeaders.authorization;
    }

    const upstream = await fetch(url, {
      method: method ?? 'POST',
      headers: upstreamHeaders,
      body: (method === 'GET') ? undefined : (body ? JSON.stringify(body) : undefined),
    });

    const data = await upstream.json();

    // Always return 200 to Supabase client — put upstream status in body
    // so supabase.functions.invoke doesn't throw on 4xx upstream errors
    return new Response(JSON.stringify({ ...data, _status: upstream.status }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
