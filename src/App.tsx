
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TitleManager } from "@/components/TitleManager";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DotLogo } from "@/components/DotLogo";
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));

import NotFound from "./pages/NotFound";
const Aprovacao = lazy(() => import("./pages/Aprovacao"));
const SocialMediaPlanejamento = lazy(() => import("./pages/SocialMediaPlanejamento"));
const SocialMediaVarredura = lazy(() => import("./pages/SocialMediaVarredura"));
import AprovacaoCliente from "./pages/AprovacaoCliente";
import SolicitacaoCancelamento from "./pages/SolicitacaoCancelamento";
import GestaoCancelamentos from "./pages/GestaoCancelamentos";
import FormCSAT from "./pages/FormCSAT";
import FormNPS from "./pages/FormNPS";
import GestaoNPS from "./pages/GestaoNPS";
import GestaoCSAT from "./pages/GestaoCSAT";
import CasesSuccesso from "./pages/CasesSuccesso";
import CasesRouter from "./pages/CasesRouter";
import GerarForms from "./pages/GerarForms";
import { PublicPageWithSidebar } from "@/components/PublicPageWithSidebar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

const DashboardFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
    <DotLogo size={48} animate />
    <div className="text-lg text-muted-foreground">Carregando...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="dot-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TitleManager />
            <Routes>
              {/* ── Main dashboard ── */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <Index />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* ── Aprovação ── */}
              <Route path="/aprovacao" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <Aprovacao />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/aprovacao-cliente/:token" element={<AprovacaoCliente />} />

              {/* ── Cancelamentos ── */}
              <Route path="/solicitacao-cancelamento" element={
                <PublicPageWithSidebar>
                  <SolicitacaoCancelamento />
                </PublicPageWithSidebar>
              } />
              <Route path="/solicitacao-cancelamento-interno" element={
                <ProtectedRoute>
                  <PublicPageWithSidebar>
                    <SolicitacaoCancelamento />
                  </PublicPageWithSidebar>
                </ProtectedRoute>
              } />
              <Route path="/gestao-cancelamentos" element={
                <ProtectedRoute>
                  <PublicPageWithSidebar>
                    <GestaoCancelamentos />
                  </PublicPageWithSidebar>
                </ProtectedRoute>
              } />

              {/* ── CSAT / NPS ── */}
              <Route path="/pesquisa-csat" element={
                <PublicPageWithSidebar><FormCSAT /></PublicPageWithSidebar>
              } />
              <Route path="/pesquisa-csat-interno" element={
                <ProtectedRoute>
                  <PublicPageWithSidebar><FormCSAT /></PublicPageWithSidebar>
                </ProtectedRoute>
              } />
              <Route path="/pesquisa-nps" element={
                <PublicPageWithSidebar><FormNPS /></PublicPageWithSidebar>
              } />
              <Route path="/pesquisa-nps-interno" element={
                <ProtectedRoute>
                  <PublicPageWithSidebar><FormNPS /></PublicPageWithSidebar>
                </ProtectedRoute>
              } />
              <Route path="/gestao-nps" element={
                <ProtectedRoute>
                  <PublicPageWithSidebar><GestaoNPS /></PublicPageWithSidebar>
                </ProtectedRoute>
              } />
              <Route path="/gestao-csat" element={
                <ProtectedRoute>
                  <PublicPageWithSidebar><GestaoCSAT /></PublicPageWithSidebar>
                </ProtectedRoute>
              } />

              {/* ── Forms / Cases ── */}
              <Route path="/gerar-forms" element={
                <ProtectedRoute><GerarForms /></ProtectedRoute>
              } />
              <Route path="/cases-sucesso" element={
                <ProtectedRoute>
                  <PublicPageWithSidebar><CasesSuccesso /></PublicPageWithSidebar>
                </ProtectedRoute>
              } />
              <Route path="/cases" element={<CasesRouter />} />
              <Route path="/cases/:param" element={<CasesRouter />} />

              {/* ── Social Media ── */}
              <Route path="/social-media/planejamento" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <SocialMediaPlanejamento />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/social-media/varredura" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <SocialMediaVarredura />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* ── Auth ── */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={
                <Suspense fallback={<DashboardFallback />}>
                  <Auth />
                </Suspense>
              } />
              <Route path="/logout" element={<Navigate to="/auth" replace />} />
              <Route path="/auth-handoff" element={<Navigate to="/dashboard" replace />} />
              <Route path="/set-password" element={<Navigate to="/dashboard" replace />} />

              {/* ── Catch-all ── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
