import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DotLogo } from '@/components/DotLogo';
import { Loader2 } from 'lucide-react';

export default function Logout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const loggedOutRef = useRef(false);
  const [status, setStatus] = useState<'logging_out' | 'done' | 'error'>('logging_out');
  const [details, setDetails] = useState('Encerrando sua sessão...');

  useEffect(() => {
    const performLogout = async () => {
      if (loggedOutRef.current) return;
      loggedOutRef.current = true;

      try {
        setStatus('logging_out');
        setDetails('Encerrando sua sessão...');
        await signOut();
        setStatus('done');
        setDetails('Sessão encerrada. Redirecionando...');
      } catch (error) {
        console.error('Erro ao encerrar sessão:', error);
        setStatus('error');
        setDetails('Erro ao encerrar sessão. Redirecionando...');
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
      navigate('/auth', { replace: true });
    };

    performLogout();
  }, [navigate, signOut]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-xl">
            <DotLogo size={48} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status === 'logging_out' ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-primary/20" />
          )}
          <span className="text-muted-foreground">{details}</span>
        </div>
      </div>
    </div>
  );
}
