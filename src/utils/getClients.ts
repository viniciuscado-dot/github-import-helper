import { supabase } from "@/integrations/supabase/external-client";

export interface CopyClient {
  id: string;
  name: string;
  squad: string;
}

export async function fetchCopyClients(): Promise<CopyClient[]> {
  const { data, error } = await supabase
    .from("copy_clients")
    .select("id, name, squad")
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }

  return (data || []) as CopyClient[];
}

export async function fetchCopyClientNames(): Promise<string[]> {
  const clients = await fetchCopyClients();
  return clients.map((c) => c.name);
}
