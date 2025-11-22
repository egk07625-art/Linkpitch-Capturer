'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle2, Terminal } from 'lucide-react';

interface AnalysisTerminalProps {
  onComplete?: () => void;
}

const logs = [
  { text: 'System Initialized...', color: 'text-zinc-500', delay: 0 },
  { text: 'Capturing Screenshot...', color: 'text-blue-400', delay: 800 },
  { text: 'Analyzing Visual Hierarchy...', color: 'text-purple-400', delay: 1600 },
  { text: 'Extracting USP...', color: 'text-emerald-400', delay: 2400 },
  { text: 'Analysis Complete.', color: 'text-white font-bold', delay: 3200 },
];

export function AnalysisTerminal({ onComplete }: AnalysisTerminalProps) {
  const [visibleLogs, setVisibleLogs] = useState<number>(0);

  useEffect(() => {
    const timeouts = logs.map((log, index) => {
      return setTimeout(() => {
        setVisibleLogs((prev) => Math.max(prev, index + 1));
        if (index === logs.length - 1 && onComplete) {
          setTimeout(onComplete, 500);
        }
      }, log.delay);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-black/80 p-6 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-4">
        <Terminal className="h-4 w-4 text-zinc-500" />
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Analysis Console
        </span>
      </div>

      <div className="space-y-3 font-mono text-sm">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 transition-opacity duration-300 ${
              index < visibleLogs ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-zinc-700">{'>'}</span>
            <span className={log.color}>
              {index < visibleLogs && (
                <TypewriterText text={log.text} />
              )}
            </span>
            {index === logs.length - 1 && index < visibleLogs && (
              <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
            )}
          </div>
        ))}
        <div className="h-4 w-2 animate-pulse bg-zinc-500" />
      </div>
    </motion.div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}
