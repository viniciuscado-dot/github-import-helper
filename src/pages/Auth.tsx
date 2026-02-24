import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLogo } from '@/components/DotLogo';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function Auth() {
  const { isAuthenticated, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  // Already logged in → go to dashboard
  if (!loading && isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    const success = await login(email, password);
    if (success) {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error('E-mail ou senha inválidos');
    }
    setIsLoggingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-xl">
            <DotLogo size={64} />
          </div>
        </div>

        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Módulo de Criação
          </h1>
        </div>

        {/* Login form */}
        <div className="mt-4 w-full max-w-sm">
          <div className="bg-card/50 backdrop-blur-sm px-6 py-6 rounded-xl border border-border/50 space-y-6">
            <p className="text-sm text-muted-foreground">
              Faça login para acessar o módulo.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-muted-foreground/60">
          Powered by DOT Conceito
        </p>
      </div>
    </div>
  );
}
