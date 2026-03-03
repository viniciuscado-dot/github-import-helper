import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RSS_URL = 'https://blog.hubspot.com/marketing/rss.xml';

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  if (match) return match[1].trim();
  // Handle CDATA
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  return cdata ? cdata[1].trim() : '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

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

    // Split by <item> tags
    const itemBlocks = xml.split(/<item>/i).slice(1);

    const items = itemBlocks.slice(0, 10).map((block) => {
      const itemXml = block.split(/<\/item>/i)[0];
      return {
        title: stripHtml(extractTag(itemXml, 'title')),
        description: stripHtml(extractTag(itemXml, 'description')).substring(0, 300),
        link: extractTag(itemXml, 'link'),
        date: extractTag(itemXml, 'pubDate'),
      };
    });

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
