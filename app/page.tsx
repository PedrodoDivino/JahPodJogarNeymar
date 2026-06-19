'use client';

import NeymarStatus from '@/components/NeymarStatus';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden selection:bg-green-500/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[150px]" />
      </div>

      <NeymarStatus />

      <footer className="absolute bottom-6 text-white/20 text-xs">
        <a
          href="https://github.com/PedrodoDivino"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/40 transition-colors"
        >
          feito com código
        </a>
      </footer>
    </main>
  );
}