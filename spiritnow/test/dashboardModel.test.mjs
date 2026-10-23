import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { postOfTheDay } from '../../iching/src/data/knowledgePosts.js';
import {
  createDashboardModel,
  dashboardApps,
  dashboardOverviewForUser,
  dashboardOverviewState,
  localDateKey,
  millisecondsUntilNextLocalMidnight,
} from '../src/dashboardModel.mjs';
import { getDailyTarotCard } from '../../tarotnow/src/utils/tarotLogic.js';

const cards = [
  { id: 'daily-a', name: 'The Star', image: '/assets/cards/star.jpg', meanings: { general_upright: 'A sourced daily message.' } },
  { id: 'daily-b', name: 'The Moon', image: '/assets/cards/moon.jpg', meanings: { general_upright: 'Another sourced message.' } },
];

test('dashboard insight inputs use existing IChing and Tarot source data with honest labels', () => {
  const date = new Date(2026, 9, 23, 12);
  const knowledge = postOfTheDay(localDateKey(date));
  const model = createDashboardModel({ date, tarotCards: cards });

  assert.equal(model.insights.iching.title, knowledge.title);
  assert.equal(model.insights.iching.body, knowledge.body);
  assert.equal(model.insights.iching.sourceType, knowledge.type);
  assert.equal(model.insights.iching.label, knowledge.type === 'hexOfDay' ? 'Quẻ trong ngày · mục Kiến thức' : 'Bài kiến thức Dịch học');
  assert.equal(model.insights.tarot.title, getDailyTarotCard(cards, date)?.name);
  assert.equal(model.insights.tarot.meaning, model.insights.tarot.title === 'The Star' ? 'A sourced daily message.' : 'Another sourced message.');
  assert.equal(model.insights.tuvi.available, false);
  assert.match(model.insights.tuvi.title, /nguồn nhận xét đã xác minh/);
});

test('IChing daily post follows Asia/Ho_Chi_Minh local date across UTC midnight boundary', () => {
  const moduleUrl = new URL('../src/dashboardModel.mjs', import.meta.url).href;
  const script = `
    import { createDashboardModel, localDateKey } from ${JSON.stringify(moduleUrl)};
    const date = new Date('2026-10-22T17:00:00.000Z');
    const model = createDashboardModel({ date });
    console.log(JSON.stringify({ dateKey: localDateKey(date), title: model.insights.iching.title }));
  `;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: { ...process.env, TZ: 'Asia/Ho_Chi_Minh' },
  });

  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), {
    dateKey: '2026-10-23',
    title: postOfTheDay('2026-10-23').title,
  });
});

test('dashboard fallback includes all known app links, including link-only TalkWithMe', () => {
  const apps = dashboardApps(null);
  assert.deepEqual(apps.map(({ id, href, streak }) => ({ id, href, streak })), [
    { id: 'iching', href: '/kinhdich/', streak: null },
    { id: 'tarot', href: '/tarot/', streak: null },
    { id: 'tuvi', href: '/tuvi/', streak: null },
    { id: 'talk', href: '/talk/', streak: null },
    { id: 'note', href: '/note/', streak: null },
  ]);
  assert.deepEqual(dashboardApps({ apps: [] }), apps);
});

test('dashboard overview waits for auth and never renders another account snapshot', () => {
  const accountAResult = {
    ownerId: 'user-a',
    data: { apps: [{ id: 'iching', streak: { currentStreak: 12 } }] },
  };

  assert.equal(dashboardOverviewState({ authLoading: true, isAuthenticated: false }), 'loading');
  assert.equal(dashboardOverviewState({ authLoading: false, isAuthenticated: false }), 'guest');
  assert.equal(dashboardOverviewForUser(accountAResult, 'user-b'), null);
  assert.equal(dashboardOverviewState({
    authLoading: false,
    isAuthenticated: true,
    overviewLoading: false,
    overviewError: '',
    overviewOwnerId: 'user-a',
    userId: 'user-b',
  }), 'loading');
  assert.equal(dashboardOverviewForUser(accountAResult, 'user-a'), accountAResult.data);
  assert.equal(dashboardOverviewState({
    authLoading: false,
    isAuthenticated: true,
    overviewLoading: false,
    overviewError: '',
    overviewOwnerId: 'user-b',
    userId: 'user-b',
  }), 'ready');
  assert.equal(dashboardOverviewState({
    authLoading: false,
    isAuthenticated: true,
    overviewLoading: false,
    overviewError: 'server unavailable',
    overviewOwnerId: null,
    userId: 'user-b',
  }), 'error');
});

test('date refresh helper schedules the next local midnight', () => {
  const beforeMidnight = new Date(2026, 9, 22, 23, 59, 59, 900);
  assert.equal(millisecondsUntilNextLocalMidnight(beforeMidnight), 100);
});

test('dashboard reuses a same-day saved Tarot card and passes through server app links/streaks', () => {
  const date = new Date(2026, 9, 23, 12);
  const overview = {
    apps: [
      { id: 'tarot', label: 'TarotNow', href: '/tarot/', streak: { dailyCardDate: localDateKey(date), dailyCardId: 'daily-b', currentStreak: 4 } },
      { id: 'talk', label: 'TalkWithMe', href: '/talk/', streak: null },
      { id: 'note', label: 'NoteNow', href: '/note/', streak: null },
    ],
  };
  const model = createDashboardModel({ date, tarotCards: cards, overview });

  assert.equal(model.insights.tarot.title, 'The Moon');
  assert.equal(model.insights.tarot.streakDate, '2026-10-23');
  assert.equal(model.apps[0].href, '/tarot/');
  assert.equal(model.apps[0].streak.currentStreak, 4);
  assert.deepEqual(model.apps.slice(1).map(({ id, href, streak }) => ({ id, href, streak })), [
    { id: 'talk', href: '/talk/', streak: null },
    { id: 'note', href: '/note/', streak: null },
  ]);
});

test('unavailable TuVi commentary remains an explicit app link and is never fabricated', () => {
  const model = createDashboardModel({ date: new Date(2026, 9, 23, 12), tarotCards: cards });

  assert.equal(model.insights.tuvi.available, false);
  assert.equal(model.insights.tuvi.href, '/tuvi/');
  assert.doesNotMatch(model.insights.tuvi.body, /năm nay bạn sẽ|vận hạn|may mắn/iu);
});
