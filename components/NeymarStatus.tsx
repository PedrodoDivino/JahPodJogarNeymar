'use client';

import { useEffect, useState } from 'react';
import { CheckResult } from '@/types';
import { getRandomPhrase } from '@/lib/phrases';
import ConfettiExplosion from './ConfettiExplosion';
import MatchCard from './MatchCard';

export default function NeymarStatus() {
  const [data, setData] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [phrase] = useState(getRandomPhrase);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.style.backgroundColor = '#0a0a0a';
      main.style.transition = 'background-color 1s ease';
    }
    document.body.style.backgroundColor = '#0a0a0a';
    document.body.style.transition = 'background-color 1s ease';
  }, []);

  useEffect(() => {
    if (!data) return;
    const color = data.playing ? '#16a34a' : '#0a0a0a';
    const main = document.querySelector('main');
    if (main) {
      main.style.backgroundColor = color;
    }
    document.body.style.backgroundColor = color;
  }, [data]);

  useEffect(() => {
    const controller = new AbortController();

    async function check() {
      try {
        const res = await fetch('/api/check-match', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const json: CheckResult & { error?: string } = await res.json();
        setData(json);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setData({
          playing: false,
          match: null,
          nextMatch: null,
          error: 'Não consegui verificar agora. Tente de novo.',
        });
      } finally {
        setLoading(false);
      }
    }

    check();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-white">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-xl font-light animate-pulse">
          Checando se o Menino da Vila vai jogar...
        </p>
      </div>
    );
  }

  const playing = data?.playing ?? false;
  const match = data?.match ?? null;
  const nextMatch = data?.nextMatch ?? null;
  const error = data?.error ?? null;

  if (playing) {
    return (
      <>
        <ConfettiExplosion trigger={playing} />
        <div className="flex flex-col items-center justify-center gap-8 text-white text-center px-4">
          <div className="animate-bounce-slow">
            <p className="text-sm uppercase tracking-[0.3em] opacity-70 mb-2">
              Escalação confirmada
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-tight bg-gradient-to-r from-green-200 via-white to-green-200 bg-clip-text text-transparent">
              JÁ TÁ PODENDO
              <br />
              JOGAR!
            </h1>
          </div>

          {match && (
            <div className="animate-pulse-slow">
              <MatchCard match={match} highlight />
            </div>
          )}

          <p className="text-lg animate-pulse">🇧🇷 Vai brasil!</p>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 text-white text-center px-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] opacity-50 mb-4">
          AINDA NÃO TÁ PODENDO JOGAR
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight mb-6">
          {phrase}
        </h1>
      </div>

      {nextMatch && (
        <div className="opacity-60">
          <p className="text-xs uppercase tracking-widest mb-3">Próximo jogo do Santos</p>
          <MatchCard match={nextMatch} />
        </div>
      )}

      {error && (
        <p className="text-sm opacity-50 max-w-md">{error}</p>
      )}

      <div className="text-center mt-4">
        <p className="text-xs opacity-30">
          Recarregue a página para verificar novamente
        </p>
      </div>
    </div>
  );
}