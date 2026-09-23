import type { SyncPlan } from './sync-plan.ts';

const PROVIDER = 'openfootball';
const SOURCE_BASE =
  'https://raw.githubusercontent.com/openfootball/england/master';

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

type ParsedMatch = {
  matchday: number;
  kickoff: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
};

export function premierLeagueSeasonSlug(now = new Date()): string {
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const start = month >= 7 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

export function premierLeagueSeasonUrl(now = new Date()): string {
  return `${SOURCE_BASE}/${premierLeagueSeasonSlug(now)}/1-premierleague.txt`;
}

export async function loadOpenFootballPlan(options?: {
  fetch?: typeof fetch;
  now?: Date;
}): Promise<SyncPlan> {
  const request = options?.fetch ?? fetch;
  const url = premierLeagueSeasonUrl(options?.now);
  const response = await request(url);

  if (!response.ok) {
    throw new Error(`Premier League season file returned ${response.status}.`);
  }

  return parsePremierLeague(await response.text());
}

export function parsePremierLeague(text: string): SyncPlan {
  const header = text.match(/^=\s+(.+?)\s+(\d{4})\/(\d{2})\s*$/m);

  if (!header) {
    throw new Error('Premier League season file has no title.');
  }

  const competitionName = header[1];
  const startYear = Number(header[2]);
  const endYear = Number(`${header[2].slice(0, 2)}${header[3]}`);
  const seasonExternalId = `${header[2]}-${header[3]}`;
  const matches = parseMatches(text, startYear);
  const teamNames = [
    ...new Set(matches.flatMap((match) => [match.home, match.away])),
  ];

  return {
    provider: PROVIDER,
    teams: teamNames.map((name) => ({
      provider: PROVIDER,
      external_id: slugify(name),
      name,
      short_name: shortName(name),
      slug: slugify(name),
      logo_url: null,
      country: 'England',
      primary_color: null,
      secondary_color: null,
    })),
    competitions: [
      {
        provider: PROVIDER,
        external_id: 'premier-league',
        name: competitionName,
        slug: 'premier-league',
        country: 'England',
        logo_url: null,
      },
    ],
    seasons: [
      {
        provider: PROVIDER,
        external_id: seasonExternalId,
        competition_external_id: 'premier-league',
        name: `${startYear}/${endYear}`,
        start_date: matches[0]?.kickoff.slice(0, 10) ?? `${startYear}-08-01`,
        end_date:
          matches[matches.length - 1]?.kickoff.slice(0, 10) ??
          `${endYear}-05-31`,
      },
    ],
    players: [],
    teamPlayers: [],
    matches: matches.map((match) => ({
      provider: PROVIDER,
      external_id: `${seasonExternalId}-md${match.matchday}-${slugify(match.home)}-${slugify(match.away)}`,
      competition_external_id: 'premier-league',
      season_external_id: seasonExternalId,
      home_team_external_id: slugify(match.home),
      away_team_external_id: slugify(match.away),
      kickoff_time: match.kickoff,
      status: match.homeScore === null ? 'scheduled' : 'finished',
      home_score: match.homeScore,
      away_score: match.awayScore,
      venue: null,
      referee: null,
    })),
    events: [],
  };
}

function parseMatches(text: string, startYear: number): ParsedMatch[] {
  let matchday = 0;
  let year = startYear;
  let monthIndex: number | null = null;
  let day: number | null = null;
  let time = '15:00';
  const matches: ParsedMatch[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith('=') || line.startsWith('#')) {
      continue;
    }

    const matchdayMatch = line.match(/Matchday\s+(\d+)/);

    if (matchdayMatch) {
      matchday = Number(matchdayMatch[1]);
      continue;
    }

    const dateMatch = line.match(
      /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Za-z]{3})\s+(\d{1,2})(?:\s+(\d{4}))?$/,
    );

    if (dateMatch) {
      const nextMonth = MONTHS[dateMatch[1]];

      if (nextMonth === undefined) {
        continue;
      }

      if (dateMatch[3]) {
        year = Number(dateMatch[3]);
      } else if (monthIndex !== null && nextMonth < monthIndex) {
        year += 1;
      }

      monthIndex = nextMonth;
      day = Number(dateMatch[2]);
      continue;
    }

    const fixture = line.match(
      /^(?:(\d{2}:\d{2})\s+)?(.+?)\s+v\s+(.+?)(?:\s+(\d+)-(\d+)(?:\s+\(\d+-\d+\))?)?\s*$/,
    );

    if (!fixture || monthIndex === null || day === null || matchday === 0) {
      continue;
    }

    if (fixture[1]) {
      time = fixture[1];
    }

    matches.push({
      matchday,
      kickoff: londonKickoff(year, monthIndex, day, time),
      home: fixture[2].trim(),
      away: fixture[3].trim(),
      homeScore: fixture[4] ? Number(fixture[4]) : null,
      awayScore: fixture[5] ? Number(fixture[5]) : null,
    });
  }

  return matches;
}

export function londonKickoff(
  year: number,
  monthIndex: number,
  day: number,
  time: string,
): string {
  const [hour, minute] = time.split(':').map(Number);
  let utc = Date.UTC(year, monthIndex, day, hour, minute);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    utc =
      Date.UTC(year, monthIndex, day, hour, minute) -
      wallClockOffset(new Date(utc), 'Europe/London');
  }

  return new Date(utc).toISOString();
}

function wallClockOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  let hour = read('hour');

  if (hour === 24) {
    hour = 0;
  }

  const asUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    hour,
    read('minute'),
    read('second'),
  );
  return asUtc - date.getTime();
}

function shortName(name: string): string {
  return name.replace(/\s+(FC|AFC)$/u, '');
}

function slugify(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'team'
  );
}
