export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  published_at: string;
  category: "Marketing" | "Ads" | "Negócios" | "IA" | "SEO" | "Social" | "Vendas" | "Design";
  url: string;
  image?: string;
}

/* ── Arquivo histórico de conteúdos Rock Content ── */
export const ROCK_CONTENT_ARCHIVE: NewsItem[] = [
  {
    id: "rc-001",
    title: "Marketing de Conteúdo: o guia completo para 2026",
    excerpt: "Tudo o que você precisa saber para criar uma estratégia de conteúdo que gera resultados reais e escaláveis.",
    source: "Rock Content",
    published_at: "2026-03-10",
    category: "Marketing",
    url: "https://rockcontent.com/br/blog/marketing-de-conteudo/",
  },
  {
    id: "rc-002",
    title: "SEO para agências: como escalar resultados orgânicos",
    excerpt: "Estratégias avançadas de SEO que agências de marketing digital podem aplicar para seus clientes.",
    source: "Rock Content",
    published_at: "2026-03-05",
    category: "SEO",
    url: "https://rockcontent.com/br/blog/seo-para-agencias/",
  },
  {
    id: "rc-003",
    title: "Como criar Landing Pages que convertem acima de 30%",
    excerpt: "Técnicas de copywriting e design que transformam visitantes em leads qualificados.",
    source: "Rock Content",
    published_at: "2026-02-28",
    category: "Marketing",
    url: "https://rockcontent.com/br/blog/landing-pages-conversao/",
  },
  {
    id: "rc-004",
    title: "Inteligência Artificial no Marketing: casos práticos",
    excerpt: "Como empresas brasileiras estão usando IA para otimizar campanhas e personalizar a experiência do cliente.",
    source: "Rock Content",
    published_at: "2026-02-20",
    category: "IA",
    url: "https://rockcontent.com/br/blog/ia-no-marketing/",
  },
  {
    id: "rc-005",
    title: "Copywriting para redes sociais: fórmulas que funcionam",
    excerpt: "As melhores técnicas de escrita persuasiva para engajar audiências no Instagram, LinkedIn e TikTok.",
    source: "Rock Content",
    published_at: "2026-02-15",
    category: "Social",
    url: "https://rockcontent.com/br/blog/copywriting-redes-sociais/",
  },
  {
    id: "rc-006",
    title: "Funil de vendas: como alinhar marketing e comercial",
    excerpt: "Metodologias para integrar equipes de marketing e vendas e aumentar a taxa de conversão.",
    source: "Rock Content",
    published_at: "2026-02-10",
    category: "Vendas",
    url: "https://rockcontent.com/br/blog/funil-de-vendas/",
  },
  {
    id: "rc-007",
    title: "Branding: como construir marcas memoráveis",
    excerpt: "Os pilares do branding moderno e como agências podem entregar valor estratégico aos clientes.",
    source: "Rock Content",
    published_at: "2026-02-05",
    category: "Design",
    url: "https://rockcontent.com/br/blog/branding/",
  },
  {
    id: "rc-008",
    title: "Métricas de marketing digital: o que realmente importa",
    excerpt: "KPIs essenciais para medir o desempenho das suas campanhas e demonstrar ROI.",
    source: "Rock Content",
    published_at: "2026-01-30",
    category: "Marketing",
    url: "https://rockcontent.com/br/blog/metricas-marketing-digital/",
  },
  {
    id: "rc-009",
    title: "Automação de marketing: guia prático para agências",
    excerpt: "Ferramentas e workflows que economizam tempo e aumentam a eficiência operacional.",
    source: "Rock Content",
    published_at: "2026-01-25",
    category: "Marketing",
    url: "https://rockcontent.com/br/blog/automacao-de-marketing/",
  },
  {
    id: "rc-010",
    title: "Google Ads vs Meta Ads: onde investir em 2026",
    excerpt: "Comparativo atualizado entre as duas maiores plataformas de mídia paga para diferentes objetivos.",
    source: "Rock Content",
    published_at: "2026-01-20",
    category: "Ads",
    url: "https://rockcontent.com/br/blog/google-ads-vs-meta-ads/",
  },
  {
    id: "rc-011",
    title: "Estratégias de conteúdo para e-commerce",
    excerpt: "Como usar blogs, vídeos e redes sociais para impulsionar vendas no comércio eletrônico.",
    source: "Rock Content",
    published_at: "2026-01-15",
    category: "Vendas",
    url: "https://rockcontent.com/br/blog/conteudo-ecommerce/",
  },
  {
    id: "rc-012",
    title: "Design System: por que sua agência precisa de um",
    excerpt: "Benefícios de padronizar componentes visuais e como implementar na prática.",
    source: "Rock Content",
    published_at: "2026-01-10",
    category: "Design",
    url: "https://rockcontent.com/br/blog/design-system/",
  },
];

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
    published_at: item.date || "",
    category: item.category || "Marketing",
    url: item.link,
    image: item.image || "",
  }));
}

export async function generateThumbnail(title: string, category: string, excerpt: string, url: string): Promise<string | null> {
  try {
    const response = await fetch("https://cesohdhspysooaowtvsu.supabase.co/functions/v1/generate-news-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, excerpt, url }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.image || null;
  } catch {
    return null;
  }
}
