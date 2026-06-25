import type { MatchInfo } from '@/types';

const SANTOS_TEAM_ID = 134286;
const BRAZIL_TEAM_ID = 134496;
const FIFA_WORLD_CUP_LEAGUE_ID = 4429;
const THE_SPORTS_DB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatBrazilDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateStr: string): Date | null {
  const match = DATE_ONLY_RE.exec(dateStr);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 12)
  );
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const dateOnly = parseDateOnly(dateStr);
  if (dateOnly) return dateOnly;

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function parseEventTimestamp(timestamp: string): Date | null {
  if (!timestamp) return null;
  const hasTimeZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  const normalized = hasTimeZone ? timestamp : `${timestamp}Z`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function eventDateKey(event: any): string | null {
  const timestamp = parseEventTimestamp(event.strTimestamp || '');
  if (timestamp) return formatBrazilDateKey(timestamp);

  const dateStr = event.dateEvent || event.strDate || '';
  if (!dateStr) return null;

  if (DATE_ONLY_RE.test(dateStr)) return dateStr;

  const d = parseDate(dateStr);
  return d ? formatBrazilDateKey(d) : null;
}

function isTodayOrUpcoming(event: any): boolean {
  const key = eventDateKey(event);
  return key === formatBrazilDateKey(new Date());
}

function formatMatchDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return 'Data a confirmar';
  return d.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatEventDate(event: any): string {
  const timestamp = parseEventTimestamp(event.strTimestamp || '');
  if (timestamp) {
    return timestamp.toLocaleDateString('pt-BR', {
      timeZone: BRAZIL_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return formatMatchDate(event.dateEvent || event.strDate || '');
}

function extractTime(event: any): string {
  const timestamp = parseEventTimestamp(event.strTimestamp || '');
  if (timestamp) {
    return timestamp.toLocaleTimeString('pt-BR', {
      timeZone: BRAZIL_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (event.strTime) return String(event.strTime).slice(0, 5);

  const dateStr = event.dateEvent || event.strDate || '';
  if (!dateStr || DATE_ONLY_RE.test(dateStr)) return 'Horário a confirmar';

  const d = parseDate(dateStr);
  if (!d) return 'Horário a confirmar';
  return d.toLocaleTimeString('pt-BR', {
    timeZone: BRAZIL_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
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
    return 'https://r2.thesportsdb.com/images/media/team/badge/j8xk9g1679447486.png';
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
    date: formatEventDate(event),
    time: extractTime(event),
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

function extractEventsPayload(data: any): any[] {
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.event)) return data.event;
  return [];
}

async function fetchTeamEvents(teamId: number, endpoint = 'eventsnext.php'): Promise<any[]> {
  const url = `${THE_SPORTS_DB_BASE}/${endpoint}?id=${teamId}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`TheSportsDB retornou ${res.status} para team ${teamId}`);
  const data = await res.json();
  return extractEventsPayload(data);
}

async function fetchDayEvents(leagueId?: number): Promise<any[]> {
  const today = formatBrazilDateKey(new Date());
  const league = leagueId ? `&l=${leagueId}` : '';
  const url = `${THE_SPORTS_DB_BASE}/eventsday.php?d=${today}&s=Soccer${league}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`TheSportsDB retornou ${res.status} para eventsday`);
  const data = await res.json();
  return extractEventsPayload(data);
}

export async function checkMatchViaTheSportsDB(): Promise<{
  playing: boolean;
  match: MatchInfo | null;
  nextMatch: MatchInfo | null;
}> {
  try {
    const nextResults = await Promise.allSettled([
      fetchTeamEvents(SANTOS_TEAM_ID),
      fetchTeamEvents(BRAZIL_TEAM_ID),
    ]);

    const recentResults = await Promise.allSettled([
      fetchTeamEvents(SANTOS_TEAM_ID, 'eventslast.php'),
      fetchTeamEvents(BRAZIL_TEAM_ID, 'eventslast.php'),
    ]);
    const dayResults = await Promise.allSettled([
      fetchDayEvents(),
      fetchDayEvents(FIFA_WORLD_CUP_LEAGUE_ID),
    ]);

    const nextEvents = nextResults.flatMap((r) =>
      r.status === 'fulfilled' ? r.value : []
    );
    const recentEvents = recentResults.flatMap((r) =>
      r.status === 'fulfilled' ? r.value : []
    );
    const dayEvents = dayResults.flatMap((r) =>
      r.status === 'fulfilled' ? r.value : []
    );
    const allEvents = [...nextEvents, ...recentEvents, ...dayEvents];

    if (allEvents.length === 0) {
      return { playing: false, match: null, nextMatch: null };
    }

    const todayEvents = allEvents.filter(isTodayOrUpcoming);

    const matchToday = todayEvents.find(isNeymarRelated) || null;

    return {
      playing: !!matchToday,
      match: matchToday ? eventToMatchInfo(matchToday) : null,
      nextMatch: nextEvents.length > 0 ? eventToMatchInfo(nextEvents[0]) : null,
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
              : 'https://r2.thesportsdb.com/images/media/team/badge/j8xk9g1679447486.png',
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
