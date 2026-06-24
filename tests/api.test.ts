import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { checkMatchViaTheSportsDB } from '../lib/api';

const originalFetch = globalThis.fetch;
const originalDate = globalThis.Date;

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

function freezeDate(isoDate: string): void {
  const fixedTime = new originalDate(isoDate).getTime();

  class FixedDate extends originalDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fixedTime);
        return;
      }

      super(args[0]);
    }

    static now(): number {
      return fixedTime;
    }
  }

  globalThis.Date = FixedDate as DateConstructor;
}

beforeEach(() => {
  freezeDate('2026-06-24T17:53:57Z');
});

afterEach(() => {
  globalThis.Date = originalDate;
  globalThis.fetch = originalFetch;
});

test('marks Brazil as playing when TheSportsDB returns today as a date-only event', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('id=134286')) {
      return jsonResponse({
        events: [
          {
            idEvent: '2478802',
            strEvent: 'Vitoria de Guimaraes vs Santos',
            strHomeTeam: 'Vitoria de Guimaraes',
            strAwayTeam: 'Santos',
            dateEvent: '2026-07-12',
            strTimestamp: '2026-07-12T17:00:00',
            strTime: '17:00:00',
            strVenue: 'Estadio D. Afonso Henriques',
            strLeague: 'Club Friendly',
          },
        ],
      });
    }

    if (url.includes('id=134496')) {
      return jsonResponse({
        events: [
          {
            idEvent: '2391765',
            strEvent: 'Scotland vs Brazil',
            strHomeTeam: 'Scotland',
            strAwayTeam: 'Brazil',
            dateEvent: '2026-06-24',
            strTimestamp: '2026-06-24T22:00:00',
            strTime: '22:00:00',
            strVenue: 'Hard Rock Stadium',
            strLeague: 'FIFA World Cup',
          },
        ],
      });
    }

    return jsonResponse({ events: [] });
  }) as typeof fetch;

  const result = await checkMatchViaTheSportsDB();

  assert.equal(result.playing, true);
  assert.equal(result.match?.id, '2391765');
  assert.equal(result.match?.homeTeam, 'Scotland');
  assert.equal(result.match?.awayTeam, 'Brazil');
  assert.equal(result.match?.date, 'quarta-feira, 24 de junho de 2026');
  assert.equal(result.match?.time, '19:00');
});
