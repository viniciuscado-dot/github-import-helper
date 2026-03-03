export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  published_at: string;
  category: "Marketing" | "Ads" | "Negócios";
  url: string;
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Como a IA está transformando campanhas de performance",
    excerpt: "Ferramentas de inteligência artificial estão redefinindo a forma como agências planejam e otimizam campanhas digitais.",
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
];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "2026-01-01";
    return d.toISOString().split("T")[0];
  } catch {
    return "2026-01-01";
  }
}

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://cesohdhspysooaowtvsu.supabase.co/functions/v1/news"
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid response format");
    }

    return data.items.map(
      (item: { title: string; description: string; link: string; date: string }, index: number): NewsItem => ({
        id: String(index),
        title: item.title || "",
        excerpt: item.description || "",
        source: "HubSpot",
        published_at: formatDate(item.date),
        category: "Marketing",
        url: item.link || "",
      })
    );
  } catch (err) {
    console.warn("Falha ao buscar notícias da API, usando fallback:", err);
    return MOCK_NEWS;
  }
}
