import { postOfTheDay } from '../../iching/src/data/knowledgePosts.js';
import {
  getCardMeaning,
  getDailyTarotCard,
  getSavedDailyTarotCard,
} from '../../tarotnow/src/utils/tarotLogic.js';

export const DASHBOARD_APP_LINKS = [
  { id: 'iching', label: 'IChingNow', href: '/kinhdich/', streak: null },
  { id: 'tarot', label: 'TarotNow', href: '/tarot/', streak: null },
  { id: 'tuvi', label: 'TuViNow', href: '/tuvi/', streak: null },
  { id: 'talk', label: 'TalkWithMe', href: '/talk/', streak: null },
  { id: 'note', label: 'NoteNow', href: '/note/', streak: null },
];

export function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function millisecondsUntilNextLocalMidnight(date) {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1, nextMidnight.getTime() - date.getTime());
}

export function dashboardApps(overview) {
  return Array.isArray(overview?.apps) && overview.apps.length > 0
    ? overview.apps
    : DASHBOARD_APP_LINKS;
}

export function createDashboardModel({ date = new Date(), tarotCards = [], overview = null } = {}) {
  const knowledgeDate = localDateKey(date);
  const knowledgePost = postOfTheDay(knowledgeDate);
  const savedTarot = overview?.apps?.find((app) => app.id === 'tarot')?.streak;
  const savedTarotCard = savedTarot?.dailyCardDate === localDateKey(date)
    ? getSavedDailyTarotCard(tarotCards, savedTarot.dailyCardId, date)
    : null;
  const tarotCard = savedTarotCard || getDailyTarotCard(tarotCards, date);

  return {
    apps: dashboardApps(overview),
    insights: {
      iching: {
        available: Boolean(knowledgePost),
        label: knowledgePost?.type === 'hexOfDay'
          ? 'Quẻ trong ngày · mục Kiến thức'
          : 'Bài kiến thức Dịch học',
        title: knowledgePost?.title || 'Chưa có bài hôm nay',
        body: knowledgePost?.body || '',
        href: '/kinhdich/',
        sourceType: knowledgePost?.type || null,
      },
      tarot: tarotCard
        ? {
            available: true,
            label: 'Lá Tarot hằng ngày',
            title: tarotCard.name,
            orientation: tarotCard.orientation,
            meaning: getCardMeaning(tarotCard, 'general', tarotCard.orientation),
            image: tarotCard.image || null,
            streakDate: savedTarotCard ? savedTarot.dailyCardDate : null,
            href: '/tarot/',
          }
        : {
            available: false,
            label: 'Lá Tarot hằng ngày',
            title: 'Chưa tải được bộ bài Tarot',
            href: '/tarot/',
          },
      tuvi: {
        available: false,
        label: 'Nhận xét Tử Vi lưu niên',
        title: 'Chưa có nguồn nhận xét đã xác minh',
        body: 'Mở TuViNow để xem nội dung từ lá số và yêu cầu luận giải theo thao tác rõ ràng.',
        href: '/tuvi/',
      },
    },
  };
}
