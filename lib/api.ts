import { MatchInfo } from '@/types';

const SANTOS_TEAM_ID = 1861;
const THE_SPORTS_DB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function isTodayOrUpcoming(dateStr: string): boolean {
  const d = parseDate(dateStr);
  if (!d) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  return d >= startOfToday && d < endOfToday;
}

function formatMatchDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return 'Data a confirmar';
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function extractTime(dateStr: string): string {
  if (!dateStr) return 'Horário a confirmar';
  const d = parseDate(dateStr);
  if (!d) return 'Horário a confirmar';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function extractStadium(event: any): string {
  if (event.strVenue) return event.strVenue;
  return 'Estádio a confirmar';
}

function extractTournament(event: any): string {
  if (event.strLeague) return event.strLeague;
  if (event.strSport) return event.strSport;
  return 'Campeonato a confirmar';
}

function extractTeamLogo(team: string, isHome: boolean): string {
  if (team?.toLowerCase().includes('santos')) {
    return 'https://www.thesportsdb.com/images/media/team/badge/n9qrn31715645718.png';
  }
  const name = team?.toLowerCase().replace(/\s+/g, '') || '';
  return `https://www.thesportsdb.com/images/media/team/badge/${name}.png`;
}

function eventToMatchInfo(event: any): MatchInfo {
  return {
    id: String(event.idEvent || ''),
    tournament: extractTournament(event),
    homeTeam: event.strHomeTeam || 'Time da casa',
    awayTeam: event.strAwayTeam || 'Time visitante',
    homeLogo: extractTeamLogo(event.strHomeTeam, true),
    awayLogo: extractTeamLogo(event.strAwayTeam, false),
    date: formatMatchDate(event.dateEvent || event.strDate || ''),
    time: extractTime(event.dateEvent || event.strDate || ''),
    stadium: extractStadium(event),
  };
}

function isNeymarRelated(event: any): boolean {
  if (!event) return false;
  const keywords = ['neymar', 'santos'];
  const text = [
    event.strEvent,
    event.strHomeTeam,
    event.strAwayTeam,
    event.strLeague,
    event.strVenue,
    event.strFilename,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return keywords.some((k) => text.includes(k));
}

export async function checkMatchViaTheSportsDB(): Promise<{
  playing: boolean;
  match: MatchInfo | null;
  nextMatch: MatchInfo | null;
}> {
  try {
    const url = `${THE_SPORTS_DB_BASE}/eventsnext.php?id=${SANTOS_TEAM_ID}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) throw new Error(`TheSportsDB retornou ${res.status}`);

    const data = await res.json();
    const events: any[] = data.events || [];

    if (events.length === 0) {
      return { playing: false, match: null, nextMatch: null };
    }

    const upcomingMatches = events.map(eventToMatchInfo);
    const next = upcomingMatches[0] ?? null;

    const playingToday = upcomingMatches.some((m) => {
      const event = events[upcomingMatches.indexOf(m)];
      return isTodayOrUpcoming(event.dateEvent || event.strDate || '') && isNeymarRelated(event);
    });

    return {
      playing: playingToday,
      match: playingToday ? next : null,
      nextMatch: next,
    };
  } catch (err) {
    console.error('TheSportsDB error:', err);
    throw err;
  }
}

export async function checkMatchFallback(): Promise<{
  playing: boolean;
  match: MatchInfo | null;
  nextMatch: MatchInfo | null;
}> {
  try {
    const proxyUrl = 'https://r.jina.ai/http://santosfc.com.br/jogos/';
    const res = await fetch(proxyUrl, {
      headers: {
        'X-Return-Format': 'markdown',
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Fallback retornou ${res.status}`);

    const text = await res.text();
    const hoje = new Date().toLocaleDateString('pt-BR');

    return {
      playing: text.toLowerCase().includes('neymar') && text.includes(hoje),
      match: null,
      nextMatch: {
        id: 'fallback',
        tournament: 'Santos FC - Site Oficial',
        homeTeam: 'Santos',
        awayTeam: 'A definir',
        homeLogo: '',
        awayLogo: '',
        date: hoje,
        time: 'Verificar site oficial',
        stadium: 'Vila Belmiro',
      },
    };
  } catch (err) {
    console.error('Fallback error:', err);
    throw err;
  }
}

export async function checkNeymarMatch(): Promise<{
  playing: boolean;
  match: MatchInfo | null;
  nextMatch: MatchInfo | null;
  error?: string;
}> {
  try {
    return await checkMatchViaTheSportsDB();
  } catch {
    try {
      return await checkMatchFallback();
    } catch {
      return {
        playing: false,
        match: null,
        nextMatch: null,
        error: 'Não consegui verificar agora. Tente de novo mais tarde.',
      };
    }
  }
}