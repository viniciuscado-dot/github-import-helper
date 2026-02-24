import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { ResponsiveGrid } from "@/components/ResponsiveGrid";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/external-client";
import { formatCurrency } from "@/utils/formatCurrency";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface BusinessData {
  mrr: number;
  plano: string;
}

export const FinancialMetrics = () => {
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [selectedPlanMRR, setSelectedPlanMRR] = useState<string>("Business");
  const [selectedPlanTicket, setSelectedPlanTicket] = useState<string>("Business");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      
      // Buscar clientes ativos do pipeline CSM (não churns, apenas MRR recorrente)
      const { data, error } = await supabase
        .from('crm_cards')
        .select('monthly_revenue, plano')
        .eq('pipeline_id', '1242a985-2f74-4b4a-bc0e-c045a3951d65')
        .eq('churn', false)
        .eq('categoria', 'MRR recorrente');

      if (error) throw error;

      const parsedBusinesses: BusinessData[] = (data || []).map(card => ({
        mrr: Number(card.monthly_revenue) || 0,
        plano: card.plano || 'Starter',
      }));

      setBusinesses(parsedBusinesses);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos
  const mrrTotal = businesses.reduce((sum, b) => sum + b.mrr, 0);
  
  const businessesByPlan = businesses.filter(b => b.plano === selectedPlanMRR);
  const mrrPorPlano = businessesByPlan.reduce((sum, b) => sum + b.mrr, 0);
  
  const ticketMedioMRR = businesses.length > 0 ? mrrTotal / businesses.length : 0;
  
  const businessesByPlanTicket = businesses.filter(b => b.plano === selectedPlanTicket);
  const ticketMedioPorPlano = businessesByPlanTicket.length > 0 
    ? businessesByPlanTicket.reduce((sum, b) => sum + b.mrr, 0) / businessesByPlanTicket.length 
    : 0;

  const plans = ["Business", "Pro", "Conceito", "Social", "Starter"];

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-8">Métricas Financeiras</h2>
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-bold">Métricas Financeiras</h2>
      
      <ResponsiveGrid 
        cols={{ default: 1, md: 2, xl: 3 }}
        gap={{ default: 6 }}
      >
        {/* MRR Total */}
        <KPICard
          title="MRR Total"
          value={formatCurrency(mrrTotal)}
          subtitle="Receita Recorrente Mensal"
          icon={DollarSign}
          variant="default"
          iconColor="text-red-500"
        />

        {/* MRR por Plano */}
        <KPICard
          title="MRR por Plano"
          value={formatCurrency(mrrPorPlano)}
          subtitle={`Plano ${selectedPlanMRR} (${businessesByPlan.length} clientes)`}
          icon={DollarSign}
          variant="default"
          iconColor="text-blue-500"
          filterComponent={
            <ToggleGroup 
              type="single" 
              value={selectedPlanMRR}
              onValueChange={(value) => value && setSelectedPlanMRR(value)}
              className="flex flex-wrap gap-2"
            >
              {plans.map(plan => (
                <ToggleGroupItem 
                  key={plan}
                  value={plan}
                  className="text-xs px-3 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {plan}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          }
        />

        {/* Ticket Médio MRR */}
        <KPICard
          title="Ticket Médio MRR"
          value={formatCurrency(ticketMedioMRR)}
          subtitle={`Média por cliente (${businesses.length} clientes)`}
          icon={TrendingUp}
          variant="default"
          iconColor="text-green-500"
        />

        {/* Ticket Médio por Plano */}
        <KPICard
          title="Ticket Médio por Plano"
          value={formatCurrency(ticketMedioPorPlano)}
          subtitle={`Plano ${selectedPlanTicket} (${businessesByPlanTicket.length} clientes)`}
          icon={TrendingUp}
          variant="default"
          iconColor="text-blue-600"
          filterComponent={
            <ToggleGroup 
              type="single" 
              value={selectedPlanTicket}
              onValueChange={(value) => value && setSelectedPlanTicket(value)}
              className="flex flex-wrap gap-2"
            >
              {plans.map(plan => (
                <ToggleGroupItem 
                  key={plan}
                  value={plan}
                  className="text-xs px-3 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {plan}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          }
        />
      </ResponsiveGrid>
    </div>
  );
};
