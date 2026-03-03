import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function makeKey(title: string, url: string): string {
  // Simple stable hash from title+url
  const str = `${title}::${url}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `news_${Math.abs(hash).toString(36)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, category, excerpt, url: newsUrl } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const newsKey = makeKey(title, newsUrl || '');

    // 1. Check if thumbnail already exists
    const { data: existing } = await supabase
      .from('news_thumbnails')
      .select('image_url')
      .eq('news_key', newsKey)
      .maybeSingle();

    if (existing?.image_url) {
      return new Response(JSON.stringify({ image: existing.image_url, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Generate thumbnail via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const prompt = `Create a minimalist abstract editorial illustration for a news article about: "${title}". Category: ${category || 'Marketing'}. Style: dark moody gradient background, modern geometric shapes, subtle glow effects, editorial magazine feel, 16:9 aspect ratio. Absolutely no text, no letters, no words in the image.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error('AI gateway error:', status, text);
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const base64Url = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Url) {
      return new Response(JSON.stringify({ error: 'No image generated' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Upload to Supabase Storage
    const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const filePath = `${newsKey}.png`;

    const { error: uploadError } = await supabase.storage
      .from('news-thumbnails')
      .upload(filePath, binaryData, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Fallback: return base64 directly
      return new Response(JSON.stringify({ image: base64Url, cached: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('news-thumbnails')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 4. Save mapping in news_thumbnails table
    await supabase.from('news_thumbnails').upsert({
      news_key: newsKey,
      image_url: publicUrl,
    }, { onConflict: 'news_key' });

    return new Response(JSON.stringify({ image: publicUrl, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
