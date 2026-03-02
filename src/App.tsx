
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
const AprovacaoEvolucao = lazy(() => import("./pages/AprovacaoEvolucao"));
const SocialMediaPlanejamento = lazy(() => import("./pages/SocialMediaPlanejamento"));
const SocialMediaVarredura = lazy(() => import("./pages/SocialMediaVarredura"));
const SocialMediaCentralPosts = lazy(() => import("./pages/SocialMediaCentralPosts"));
const LaboratorioEditorVideo = lazy(() => import("./pages/LaboratorioEditorVideo"));
const LaboratorioBancoIdeias = lazy(() => import("./pages/LaboratorioBancoIdeias"));
const LaboratorioLPBuilder = lazy(() => import("./pages/LaboratorioLPBuilder"));
const LaboratorioDiagnosticoVisual = lazy(() => import("./pages/LaboratorioDiagnosticoVisual"));
const Noticias = lazy(() => import("./pages/Noticias"));
import AprovacaoCliente from "./pages/AprovacaoCliente";
const Anuncios = lazy(() => import("./pages/Anuncios"));
const AnaliseArtefato = lazy(() => import("./pages/AnaliseArtefato"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
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
              <Route path="/aprovacao/evolucao" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <AprovacaoEvolucao />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/aprovacao-cliente/:token" element={<AprovacaoCliente />} />
              <Route path="/analise/:token" element={
                <Suspense fallback={<DashboardFallback />}>
                  <AnaliseArtefato />
                </Suspense>
              } />

              {/* ── Anúncios ── */}
              <Route path="/performance/anuncios" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <Anuncios />
                  </Suspense>
                </ProtectedRoute>
              } />

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
              <Route path="/social-media/central-posts" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <SocialMediaCentralPosts />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* ── Laboratório ── */}
              <Route path="/laboratorio/editor-video" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <LaboratorioEditorVideo />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/laboratorio/banco-ideias" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <LaboratorioBancoIdeias />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/laboratorio/lp-builder" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <LaboratorioLPBuilder />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/laboratorio/diagnostico-visual" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <LaboratorioDiagnosticoVisual />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* ── Notícias ── */}
              <Route path="/noticias" element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardFallback />}>
                    <Noticias />
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
