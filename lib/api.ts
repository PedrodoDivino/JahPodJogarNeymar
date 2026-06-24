import { MatchInfo } from '@/types';

const SANTOS_TEAM_ID = 1861;
const BRAZIL_TEAM_ID = 134496;
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

function extractTeamLogo(team: string): string {
  if (!team) return '';
  const lower = team.toLowerCase();
  if (lower.includes('santos')) {
    return 'https://www.thesportsdb.com/images/media/team/badge/n9qrn31715645718.png';
  }
  if (lower.includes('brazil') || lower.includes('brasil')) {
    return 'https://r2.thesportsdb.com/images/media/team/badge/jl6dip1726167280.png';
  }
  const name = lower.replace(/\s+/g, '');
  return `https://www.thesportsdb.com/images/media/team/badge/${name}.png`;
}

function eventToMatchInfo(event: any): MatchInfo {
  return {
    id: String(event.idEvent || ''),
    tournament: extractTournament(event),
    homeTeam: event.strHomeTeam || 'Time da casa',
    awayTeam: event.strAwayTeam || 'Time visitante',
    homeLogo: extractTeamLogo(event.strHomeTeam),
    awayLogo: extractTeamLogo(event.strAwayTeam),
    date: formatMatchDate(event.dateEvent || event.strDate || ''),
    time: extractTime(event.dateEvent || event.strDate || ''),
    stadium: extractStadium(event),
  };
}

function isNeymarRelated(event: any): boolean {
  if (!event) return false;
  const keywords = ['neymar', 'santos', 'brasil', 'brazil'];
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

async function fetchTeamEvents(teamId: number): Promise<any[]> {
  const url = `${THE_SPORTS_DB_BASE}/eventsnext.php?id=${teamId}`;
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`TheSportsDB retornou ${res.status} para team ${teamId}`);
  const data = await res.json();
  return data.events || [];
}

export async function checkMatchViaTheSportsDB(): Promise<{
  playing: boolean;
  match: MatchInfo | null;
  nextMatch: MatchInfo | null;
}> {
  try {
    const [santosEvents, brazilEvents] = await Promise.all([
      fetchTeamEvents(SANTOS_TEAM_ID),
      fetchTeamEvents(BRAZIL_TEAM_ID),
    ]);

    const allEvents = [...santosEvents, ...brazilEvents];

    if (allEvents.length === 0) {
      return { playing: false, match: null, nextMatch: null };
    }

    const todayEvents = allEvents.filter((e) =>
      isTodayOrUpcoming(e.dateEvent || e.strDate || '')
    );

    const matchToday = todayEvents.find(isNeymarRelated) || null;

    return {
      playing: !!matchToday,
      match: matchToday ? eventToMatchInfo(matchToday) : null,
      nextMatch: allEvents.length > 0 ? eventToMatchInfo(allEvents[0]) : null,
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
    const hoje = new Date().toLocaleDateString('pt-BR');
    const hojeISO = new Date().toISOString().split('T')[0];

    const [santosRes, brazilRes] = await Promise.allSettled([
      fetch('https://r.jina.ai/http://santosfc.com.br/jogos/', {
        headers: { 'X-Return-Format': 'markdown', 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 },
      }),
      fetch('https://r.jina.ai/https://www.cbf.com.br/selecao-brasileira/jogos', {
        headers: { 'X-Return-Format': 'markdown', 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 },
      }),
    ]);

    let playing = false;
    let source = '';

    if (santosRes.status === 'fulfilled' && santosRes.value.ok) {
      const text = await santosRes.value.text();
      if (text.toLowerCase().includes('neymar') && text.includes(hoje)) {
        playing = true;
        source = 'Santos';
      }
    }

    if (!playing && brazilRes.status === 'fulfilled' && brazilRes.value.ok) {
      const text = await brazilRes.value.text();
      if (text.toLowerCase().includes('neymar') && text.includes(hoje)) {
        playing = true;
        source = 'Seleção Brasileira';
      }
    }

    return {
      playing,
      match: playing
        ? {
            id: 'fallback',
            tournament: source === 'Seleção Brasileira' ? 'Seleção Brasileira' : 'Santos FC',
            homeTeam: source === 'Seleção Brasileira' ? 'Brasil' : 'Santos',
            awayTeam: 'A definir',
            homeLogo: source === 'Seleção Brasileira'
              ? 'https://r2.thesportsdb.com/images/media/team/badge/jl6dip1726167280.png'
              : 'https://www.thesportsdb.com/images/media/team/badge/n9qrn31715645718.png',
            awayLogo: '',
            date: hoje,
            time: 'Verificar site oficial',
            stadium: source === 'Seleção Brasileira' ? 'A definir' : 'Vila Belmiro',
          }
        : null,
      nextMatch: null,
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