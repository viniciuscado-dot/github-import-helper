export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  published_at: string;
  category: "Marketing" | "Ads" | "Negócios";
  url: string;
  image?: string;
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Como a IA está transformando campanhas de performance",
    excerpt:
      "Ferramentas de inteligência artificial estão redefinindo a forma como agências planejam e otimizam campanhas digitais.",
    source: "Think with Google",
    published_at: "2026-02-22",
    category: "Marketing",
    url: "https://www.thinkwithgoogle.com",
  },
  {
    id: "2",
    title: "Tendências de branding para 2026: o que esperar",
    excerpt: "Marcas estão apostando em autenticidade e comunidades nichadas como diferencial competitivo.",
    source: "Meio & Mensagem",
    published_at: "2026-02-21",
    category: "Negócios",
    url: "https://www.meioemensagem.com.br",
  },
  {
    id: "3",
    title: "Meta anuncia novos formatos de anúncios para Reels",
    excerpt: "A plataforma libera recursos nativos de compra direta dentro de vídeos curtos no Instagram.",
    source: "AdAge",
    published_at: "2026-02-20",
    category: "Ads",
    url: "https://www.adage.com",
  },
  {
    id: "4",
    title: "O impacto do CGC (Consumer Generated Content) nas vendas",
    excerpt: "Pesquisa mostra que conteúdo gerado por consumidores aumenta conversão em até 30%.",
    source: "HubSpot Blog",
    published_at: "2026-02-19",
    category: "Marketing",
    url: "https://blog.hubspot.com",
  },
  {
    id: "5",
    title: "Google Ads simplifica campanhas com automação total",
    excerpt: "Novo modo Performance Max+ promete resultados com mínima configuração manual.",
    source: "Search Engine Land",
    published_at: "2026-02-18",
    category: "Ads",
    url: "https://searchengineland.com",
  },
  {
    id: "6",
    title: "Mercado publicitário cresce 12% no Brasil em 2025",
    excerpt: "Investimentos em mídia digital lideram o crescimento, com destaque para vídeo e social.",
    source: "Meio & Mensagem",
    published_at: "2026-02-17",
    category: "Negócios",
    url: "https://www.meioemensagem.com.br",
  },
  {
    id: "7",
    title: "TikTok Shop expande para novos mercados na América Latina",
    excerpt: "A funcionalidade de e-commerce nativo do TikTok chega a mais países da região.",
    source: "TechCrunch",
    published_at: "2026-02-16",
    category: "Negócios",
    url: "https://techcrunch.com",
  },
  {
    id: "8",
    title: "5 métricas de social media que toda agência deveria acompanhar",
    excerpt: "Especialistas indicam quais KPIs realmente importam para demonstrar valor ao cliente.",
    source: "Sprout Social",
    published_at: "2026-02-15",
    category: "Marketing",
    url: "https://sproutsocial.com",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function fetchNews(): Promise<NewsItem[]> {
  const response = await fetch("https://cesohdhspysooaowtvsu.supabase.co/functions/v1/news", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  return data.items.map((item: any, index: number) => ({
    id: String(index),
    title: item.title,
    excerpt: item.description,
    source: item.source || "Fonte",
    published_at: item.date?.split(" ")[0] || "",
    category: "Marketing",
    url: item.link,
    image: item.image || "",
  }));
}
