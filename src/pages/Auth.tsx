import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLogo } from '@/components/DotLogo';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/external-client';

export default function Auth() {
  const { isAuthenticated, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  }, []);

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
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      {/* Background radial glows */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(56,100,220,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 70% 70%, rgba(80,60,200,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 20% 60%, rgba(30,160,200,0.04) 0%, transparent 70%)'
      }} />

      {/* Glass login card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="auth-glass-card relative z-10 w-full max-w-sm px-8 py-10 flex flex-col items-center gap-6"
      >
        {/* Rotating border effect */}
        <div className="auth-glass-card-border" aria-hidden />

        {/* Mouse-follow specular shine */}
        <div className="auth-specular" aria-hidden />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <DotLogo size={36} />

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center">
            Faça login para acessar o módulo.
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 w-full">
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

      {/* Footer */}
      <div className="absolute bottom-8 text-center z-10">
        <p className="text-xs text-muted-foreground/60">
          Powered by DOT Conceito
        </p>
      </div>

      {/* Scoped styles */}
      <style>{`
        .auth-glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2rem;
          box-shadow:
            inset 0 0 40px rgba(56, 100, 220, 0.04),
            0 20px 60px -10px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          position: relative;
        }

        .auth-glass-card-border {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            transparent 75%,
            rgba(56, 100, 220, 0.15) 90%,
            rgba(80, 60, 200, 0.1) 95%,
            transparent 100%
          );
          animation: auth-border-rotate 20s linear infinite;
          z-index: 1;
          filter: blur(20px);
          opacity: 0.6;
          pointer-events: none;
        }

        @keyframes auth-border-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .auth-specular {
          position: absolute;
          inset: 0;
          border-radius: 2rem;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.08) 0%,
            transparent 60%
          );
          pointer-events: none;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .auth-glass-card:hover .auth-specular {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
