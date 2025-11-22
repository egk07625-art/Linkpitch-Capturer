'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnalysisTerminal } from '@/components/mixer/AnalysisTerminal';
import { analyzeUrl } from '@/app/actions/analyze-url';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

export default function VisionAnalysisPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [credits, setCredits] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { userId } = useAuth();

  // Fetch user credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/user/credits');
        const data = await response.json();
        if (data.success) {
          setCredits(data.credits);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };

    fetchCredits();
    inputRef.current?.focus();
  }, [userId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;

    setStatus('analyzing');
    
    try {
      const result = await analyzeUrl(url);
      
      // Handle NO_CREDITS error
      if (!result.success && result.error === 'NO_CREDITS') {
        toast.error(result.message || '무료 횟수가 모두 소진되었습니다. 더 많은 분석을 위해 플랜을 업그레이드하세요.');
        setStatus('idle');
        return;
      }

      // Handle other errors
      if (!result.success) {
        toast.error(result.message || '분석 중 오류가 발생했습니다.');
        setStatus('idle');
        return;
      }

      // Success case
      if (result.success && result.redirectUrl) {
        // Update credits display
        if (result.remainingCredits !== undefined) {
          setCredits(result.remainingCredits);
        }
        
        // Store the redirect URL to use it later
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('redirectUrl', result.redirectUrl);
        }
      }
    } catch (error) {
      console.error('Analysis failed', error);
      toast.error('분석 중 오류가 발생했습니다.');
      setStatus('idle');
    }
  };

  const handleTerminalComplete = () => {
    if (typeof window !== 'undefined') {
      const redirectUrl = window.sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        console.log('Waiting for server response...');
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-white selection:bg-white/20 relative">
      {/* Credit Badge */}
      {credits !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full text-sm text-zinc-400 flex items-center gap-2"
        >
          <Gift className="w-4 h-4 text-indigo-400" />
          <span>
            무료 크레딧: <span className="text-white font-semibold">{credits}</span>회 남음
          </span>
        </motion.div>
      )}
      
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            key="input-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
            className="flex w-full max-w-4xl flex-col items-center gap-12"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="text-center text-lg font-medium text-zinc-400 md:text-xl"
            >
              분석할 브랜드의 URL을 입력하세요
            </motion.h1>

            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="linkpitch.io"
                className="w-full bg-transparent text-center text-4xl font-bold text-white placeholder:text-zinc-800 focus:outline-none md:text-6xl"
                autoComplete="off"
                spellCheck="false"
              />
              
              <AnimatePresence>
                {url.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full rounded-full bg-white p-4 text-black shadow-lg shadow-white/10 transition-colors hover:bg-zinc-200 md:-right-12"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        ) : (
          <AnalysisTerminal onComplete={handleTerminalComplete} />
        )}
      </AnimatePresence>
    </main>
  );
}
