import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLogo } from '@/components/DotLogo';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_STEP_MESSAGES = [
  'Lendo dados do briefing…',
  'Analisando diferenciais competitivos…',
  'Estruturando ângulo estratégico…',
  'Aplicando técnicas de copywriting…',
  'Refinando persuasão e gatilhos mentais…',
  'Otimizando estrutura de conversão…',
  'Finalizando geração…',
];

const STEP_INTERVAL = 2800;

interface CopyGenerationOverlayProps {
  status: 'generating' | 'success' | 'error';
  onRetry?: () => void;
  errorMessage?: string;
  title?: string;
  successMessage?: string;
  stepMessages?: string[];
}

export function CopyGenerationOverlay({ status, onRetry, errorMessage, title, successMessage, stepMessages }: CopyGenerationOverlayProps) {
  const STEP_MESSAGES = stepMessages || DEFAULT_STEP_MESSAGES;
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  // Simulated progress 0→90 while generating
  useEffect(() => {
    if (status !== 'generating') return;
    setProgress(0);
    setStepIndex(0);

    const startTime = Date.now();
    const duration = STEP_MESSAGES.length * STEP_INTERVAL; // ~19.6s to reach 90%

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(elapsed / duration, 1);
      // Ease-out curve for natural deceleration
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.min(eased * 90, 90));
    }, 100);

    return () => clearInterval(timer);
  }, [status]);

  // Step text rotation
  useEffect(() => {
    if (status !== 'generating') return;
    const timer = setInterval(() => {
      setStepIndex(prev => (prev + 1) % STEP_MESSAGES.length);
    }, STEP_INTERVAL);
    return () => clearInterval(timer);
  }, [status]);

  // Animate to 100% on success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setProgress(100), 100);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur + gradient */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-6 px-8 py-10 max-w-md w-full"
      >
        {/* Logo with glow */}
        <div className="relative">
          <div
            className="absolute inset-0 blur-2xl opacity-40 rounded-full scale-150"
            style={{ background: 'hsl(var(--primary) / 0.3)' }}
          />
          <DotLogo size={64} animate={status === 'generating'} />
        </div>

        {/* Title */}
        <AnimatePresence mode="wait">
          {status === 'generating' && (
            <motion.p
              key="generating"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-lg font-semibold text-foreground"
            >
              {title || 'Gerando copy com IA…'}
            </motion.p>
          )}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-lg font-semibold text-foreground"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </motion.div>
              Copy gerada com sucesso
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-2 text-lg font-semibold text-destructive">
                <AlertCircle className="h-6 w-6" />
                Houve um problema na geração
              </div>
              {errorMessage && (
                <p className="text-sm text-muted-foreground text-center max-w-xs">{errorMessage}</p>
              )}
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {status !== 'error' && (
          <div className="w-full space-y-3">
            <div className="relative w-full h-2 rounded-full bg-muted/50 overflow-hidden backdrop-blur-sm border border-border/30">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                  boxShadow: '0 0 12px hsl(var(--primary) / 0.4)',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              {status === 'success' && <span>Concluído</span>}
            </div>
          </div>
        )}

        {/* Dynamic step text */}
        {status === 'generating' && (
          <div className="h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground"
              >
                {STEP_MESSAGES[stepIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
