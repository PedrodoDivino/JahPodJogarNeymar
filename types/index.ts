export interface MatchInfo {
  id: string;
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  date: string;
  time: string;
  stadium: string;
}

export interface CheckResult {
  playing: boolean;
  match: MatchInfo | null;
  nextMatch: MatchInfo | null;
  error?: string;
}