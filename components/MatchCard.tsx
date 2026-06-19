'use client';

import { MatchInfo } from '@/types';

interface Props {
  match: MatchInfo;
  highlight?: boolean;
}

export default function MatchCard({ match, highlight }: Props) {
  return (
    <div
      className={
        'rounded-2xl border p-6 backdrop-blur-sm w-full max-w-md transition-all ' +
        (highlight
          ? 'bg-white/20 border-white/30 shadow-lg shadow-green-500/30'
          : 'bg-white/5 border-white/10')
      }
    >
      <div className="text-center mb-4">
        <p className="text-xs uppercase tracking-widest opacity-70 mb-1">
          {match.tournament}
        </p>
        <p className="text-sm opacity-80">{match.date}</p>
        <p className="text-lg font-bold">{match.time}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl">
            {match.homeLogo ? (
              <img
                src={match.homeLogo}
                alt={match.homeTeam}
                className="w-12 h-12 object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className="hidden">{match.homeTeam.charAt(0)}</span>
          </div>
          <span className="text-sm font-semibold text-center leading-tight">
            {match.homeTeam}
          </span>
        </div>

        <div className="text-center flex-shrink-0">
          <span className="text-2xl font-black opacity-60">VS</span>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl">
            {match.awayLogo ? (
              <img
                src={match.awayLogo}
                alt={match.awayTeam}
                className="w-12 h-12 object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className="hidden">{match.awayTeam.charAt(0)}</span>
          </div>
          <span className="text-sm font-semibold text-center leading-tight">
            {match.awayTeam}
          </span>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-xs opacity-60">📍 {match.stadium}</p>
      </div>
    </div>
  );
}