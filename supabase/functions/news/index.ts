import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RSS_URL = 'https://blog.hubspot.com/marketing/rss.xml';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rssResponse = await fetch(RSS_URL);
    if (!rssResponse.ok) {
      throw new Error(`RSS fetch failed: ${rssResponse.status}`);
    }

    const xml = await rssResponse.text();
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    if (!doc) {
      throw new Error('Failed to parse XML');
    }

    const items = Array.from(doc.querySelectorAll('item'))
      .slice(0, 10)
      .map((item) => ({
        title: item.querySelector('title')?.textContent?.trim() ?? '',
        description: item.querySelector('description')?.textContent?.trim() ?? '',
        link: item.querySelector('link')?.textContent?.trim() ?? '',
        date: item.querySelector('pubDate')?.textContent?.trim() ?? '',
      }));

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('News RSS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
