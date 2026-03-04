import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEEDS = [
  { url: 'https://www.thinkwithgoogle.com/intl/pt-br/feed/', source: 'Think with Google', lang: 'pt' },
  { url: 'https://resultadosdigitais.com.br/blog/feed/', source: 'RD Station', lang: 'pt' },
  { url: 'https://rockcontent.com/br/blog/feed/', source: 'Rock Content', lang: 'pt' },
  { url: 'https://neilpatel.com/br/blog/feed/', source: 'Neil Patel BR', lang: 'pt' },
  { url: 'https://blog.hubspot.com/marketing/rss.xml', source: 'HubSpot', lang: 'en' },
];

const PT_KEYWORDS = [
  'marketing', 'negócio', 'negocios', 'publicidade', 'anúncio', 'anuncios',
  'ads', 'inteligência artificial', 'inteligencia artificial', ' ia ',
  'design', 'performance', 'vendas', 'estratégia', 'estrategia', 'digital',
  'conteúdo', 'conteudo', 'seo', 'mídia', 'midia', 'marca', 'branding',
  'growth', 'conversão', 'conversao', 'leads', 'funil', 'tráfego', 'trafego',
];

function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdata) return cdata[1].trim();
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : '';
}

function extractImage(xml: string): string {
  // media:content url
  const mc = xml.match(/<media:content[^>]+url=["']([^"']+)["']/);
  if (mc) return mc[1];
  // media:thumbnail url
  const mt = xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/);
  if (mt) return mt[1];
  // enclosure
  const enc = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/);
  if (enc) return enc[1];
  // og or img inside description/content
  const img = xml.match(/<img[^>]+src=["']([^"']+)["']/);
  if (img) return img[1];
  return '';
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(html: string): string {
  return decodeEntities(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function matchesTheme(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return PT_KEYWORDS.some(k => text.includes(k));
}

function categorize(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // IA / Tecnologia
  if (/\b(inteligência artificial|inteligencia artificial|\bia\b|machine learning|deep learning|chatgpt|gpt|gemini|llm|automação|automacao|chatbot|algoritmo)\b/.test(text)) return 'IA';
  
  // Ads / Mídia Paga
  if (/\b(ads|anúncio|anuncio|google ads|meta ads|facebook ads|tráfego pago|trafego pago|cpc|cpm|roas|performance max|campanha paga|mídia paga|midia paga|remarketing|retargeting)\b/.test(text)) return 'Ads';
  
  // SEO
  if (/\b(seo|search engine|busca orgânica|busca organica|ranqueamento|palavras?.chave|backlink|serp|indexação|indexacao)\b/.test(text)) return 'SEO';
  
  // Social Media
  if (/\b(instagram|tiktok|linkedin|youtube|reels|stories|social media|redes sociais|engajamento|influenciador|creator|conteúdo|conteudo|ugc|cgc)\b/.test(text)) return 'Social';
  
  // Vendas / Conversão
  if (/\b(vendas|conversão|conversao|funil|leads?|crm|comercial|receita|faturamento|roi|landing page|lp)\b/.test(text)) return 'Vendas';
  
  // Design / Branding
  if (/\b(design|branding|marca|identidade visual|ui|ux|criativo|layout)\b/.test(text)) return 'Design';
  
  // Negócios / Estratégia
  if (/\b(negócio|negocios|estratégia|estrategia|growth|startup|empreendedor|mercado|tendência|tendencia)\b/.test(text)) return 'Negócios';
  
  return 'Marketing';
}

interface RawItem {
  title: string;
  description: string;
  link: string;
  date: string;
  source: string;
  image: string;
  lang: string;
  category: string;
}

async function fetchOgImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DOT-News-Bot/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) return '';
    const html = await res.text();
    // og:image
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return og ? og[1] : '';
  } catch {
    return '';
  }
}

async function fetchFeed(url: string, source: string, lang: string): Promise<RawItem[]> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'DOT-News-Bot/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const blocks = xml.split(/<item>/i).slice(1);
    const items = blocks.map(block => {
      const itemXml = block.split(/<\/item>/i)[0];
      const title = stripHtml(extractTag(itemXml, 'title'));
      const description = stripHtml(extractTag(itemXml, 'description')).substring(0, 300);
      return {
        title,
        description,
        link: extractTag(itemXml, 'link'),
        date: extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date'),
        source,
        image: extractImage(itemXml),
        lang,
        category: categorize(title, description),
      };
    }).filter(i => i.title && i.link);

    // For items missing images, try fetching og:image (limit to 5 to avoid slowdown)
    const noImage = items.filter(i => !i.image);
    const toFetch = noImage.slice(0, 5);
    await Promise.all(toFetch.map(async (item) => {
      const ogImg = await fetchOgImage(item.link);
      if (ogImg) item.image = ogImg;
    }));

    return items;
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = await Promise.all(FEEDS.map(f => fetchFeed(f.url, f.source, f.lang)));
    const all = results.flat();

    // Deduplicate by link
    const seen = new Set<string>();
    const unique = all.filter(item => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    });

    // Separate PT vs EN, filter EN by theme
    const pt = unique.filter(i => i.lang === 'pt');
    const en = unique.filter(i => i.lang === 'en' && matchesTheme(i.title, i.description));

    // Prioritize PT, fill with EN
    let combined = [...pt, ...en];

    // Sort by date descending
    combined.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    let items = combined.slice(0, 30).map(({ lang, ...rest }) => rest);

    // Second pass: fetch og:image for top items still missing images (up to 5)
    const missingImg = items.filter(i => !i.image).slice(0, 5);
    if (missingImg.length > 0) {
      await Promise.all(missingImg.map(async (item) => {
        const ogImg = await fetchOgImage(item.link);
        if (ogImg) item.image = ogImg;
      }));
    }

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('News RSS error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
