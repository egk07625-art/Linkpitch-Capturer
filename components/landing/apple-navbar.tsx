'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function AppleNavbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/10 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo - Left */}
        <Link href="/" className="text-xl font-bold tracking-tighter text-white">
          LinkPitch
        </Link>
      </div>
    </motion.nav>
  );
}
