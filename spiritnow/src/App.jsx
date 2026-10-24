import { useEffect, useMemo, useState } from 'react';
import AppFooter from '@shared/components/AppFooter.jsx';
import AppHeader from '@shared/components/AppHeader.jsx';
import { useAuth } from '@shared/context/AuthContext.jsx';
import { getAppLink } from '@shared/utils/appLinks.mjs';
import {
  createDashboardModel,
  dashboardOverviewForUser,
  dashboardOverviewState,
  millisecondsUntilNextLocalMidnight,
} from './dashboardModel.mjs';
import { fetchMeOverview, fetchTarotCards } from './overviewApi.mjs';

const spiritNowTheme = {
  bg: 'rgba(7, 15, 27, 0.88)',
  accent: '#7dd3c7',
  accentSoft: 'rgba(125, 211, 199, 0.14)',
  accentHover: 'rgba(125, 211, 199, 0.24)',
  text: '#eef2f8',
  textMuted: '#9aaabe',
  border: 'rgba(211, 223, 242, 0.12)',
  drawerBg: '#08111f',
  dropdownBg: '#0b1626',
  dropdownBorder: 'rgba(125, 211, 199, 0.25)',
  dropdownItemText: '#eef2f8',
  dropdownItemSub: '#9aaabe',
  dropdownHeader: '#7dd3c7',
  dropdownArrow: '#7dd3c7',
  hoverBg: 'rgba(125, 211, 199, 0.12)',
  titleFont: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

function appHref(path) {
  return getAppLink(path, { DEV: import.meta.env.DEV }, window.location);
}

function InsightCard({ title, label, body, href, linkText, children, className = '' }) {
  return (
    <article className={`insight-card ${className}`}>
      <div className="insight-card-topline">
        <span className="insight-dot" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {children}
      <a className="text-link" href={appHref(href)}>
        {linkText} <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}

function StreakSummary({ apps, loading }) {
  if (loading) {
    return <div className="streak-grid" aria-label="Đang tải tiến độ">{[1, 2, 3].map((item) => <div className="streak-skeleton" key={item} />)}</div>;
  }
  return (
    <div className="streak-grid">
      {apps.filter((app) => ['iching', 'tarot', 'tuvi'].includes(app.id)).map((app) => (
        <a className="streak-tile" href={appHref(app.href)} key={app.id}>
          <span className="streak-app-name">{app.label}</span>
          <strong>{app.streak?.currentStreak ?? 0}</strong>
          <span className="streak-caption">ngày liên tiếp</span>
          <span className="streak-record">Kỷ lục {app.streak?.longestStreak ?? 0} ngày</span>
        </a>
      ))}
    </div>
  );
}

function App() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [overviewResult, setOverviewResult] = useState({ ownerId: null, data: null });
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [tarotCards, setTarotCards] = useState([]);
  const [tarotError, setTarotError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [dashboardDate, setDashboardDate] = useState(() => new Date());

  useEffect(() => {
    let midnightTimer;
    const refreshDateAndSchedule = () => {
      window.clearTimeout(midnightTimer);
      const now = new Date();
      setDashboardDate(now);
      midnightTimer = window.setTimeout(
        refreshDateAndSchedule,
        millisecondsUntilNextLocalMidnight(now) + 50,
      );
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshDateAndSchedule();
    };

    refreshDateAndSchedule();
    window.addEventListener('focus', refreshDateAndSchedule);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearTimeout(midnightTimer);
      window.removeEventListener('focus', refreshDateAndSchedule);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTarotCards(fetch, window.location, { signal: controller.signal })
      .then((cards) => setTarotCards(cards))
      .catch(() => {
        if (!controller.signal.aborted) setTarotError('Chưa tải được bộ bài Tarot.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?.id) {
      setOverviewResult({ ownerId: null, data: null });
      setOverviewLoading(false);
      setOverviewError('');
      return undefined;
    }

    const controller = new AbortController();
    setOverviewResult({ ownerId: null, data: null });
    setOverviewLoading(true);
    setOverviewError('');
    fetchMeOverview({ signal: controller.signal })
      .then((data) => setOverviewResult({ ownerId: user.id, data }))
      .catch((error) => {
        if (!controller.signal.aborted) setOverviewError(error.message || 'Không tải được tổng quan.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setOverviewLoading(false);
      });
    return () => controller.abort();
  }, [authLoading, isAuthenticated, user?.id, retryKey]);

  const overview = dashboardOverviewForUser(overviewResult, user?.id);
  const overviewState = dashboardOverviewState({
    authLoading,
    isAuthenticated,
    overviewLoading,
    overviewError,
    overviewOwnerId: overviewResult.ownerId,
    userId: user?.id,
  });
  const model = useMemo(
    () => createDashboardModel({ date: dashboardDate, tarotCards, overview }),
    [dashboardDate, tarotCards, overview],
  );
  const tarotImage = model.insights.tarot.image
    ? `${appHref('/tarot/')}${model.insights.tarot.image.replace(/^\//, '')}`
    : null;

  return (
    <div className="spirit-shell">
      <AppHeader
        appId="spiritnow"
        colors={spiritNowTheme}
        title="SpiritNow"
        subtitle="Hệ sinh thái SpiritNow"
        onLogoClick={() => {
          window.location.href = appHref('/spiritnow/');
        }}
        useAuthHook={useAuth}
        logo={
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
        }
      />

      <main className="dashboard-content">
        <section className="hero">
          <div>
            <p className="eyebrow">KHÔNG GIAN CỦA BẠN</p>
            <h1>Một ngày, ba góc nhìn.</h1>
            <p className="hero-copy">Tổng quan các ứng dụng SpiritNow và những nội dung hằng ngày đang có nguồn dữ liệu rõ ràng.</p>
          </div>
          <div className="hero-orbit" aria-hidden="true"><span>☯</span><i /><b /></div>
        </section>

        <section className="streak-section" aria-labelledby="streak-heading">
          <div className="section-heading">
            <div><p className="eyebrow">NHỊP ĐỘ CỦA BẠN</p><h2 id="streak-heading">Tiến độ gần đây</h2></div>
          </div>
          {overviewState === 'loading' ? (
            <StreakSummary apps={model.apps} loading />
          ) : overviewState === 'guest' ? (
            <div className="guest-state">Đăng nhập để xem streak được đồng bộ giữa các thiết bị.</div>
          ) : overviewState === 'error' ? (
            <div className="notice" role="alert">
              <span>{overviewError}</span>
              <button className="text-link button-link" type="button" onClick={() => setRetryKey((key) => key + 1)}>Thử lại</button>
            </div>
          ) : (
            <StreakSummary apps={model.apps} loading={false} />
          )}
        </section>

        <section className="insights-section" aria-labelledby="insights-heading">
          <div className="section-heading">
            <div><p className="eyebrow">THAM KHẢO HÔM NAY</p><h2 id="insights-heading">Daily Insight</h2></div>
            <span className="section-note">Mỗi nguồn được ghi nhãn theo dữ liệu hiện có</span>
          </div>
          <div className="insight-grid">
            <InsightCard
              className="iching-card"
              title={model.insights.iching.title}
              label={model.insights.iching.label}
              body={model.insights.iching.body}
              href={model.insights.iching.href}
              linkText="Mở IChingNow"
            />
            <InsightCard
              className="tarot-card"
              title={model.insights.tarot.title}
              label={model.insights.tarot.label}
              href={model.insights.tarot.href}
              linkText="Mở TarotNow"
            >
              {tarotImage && <img className="tarot-image" src={tarotImage} alt={model.insights.tarot.title} loading="lazy" />}
              {model.insights.tarot.available ? (
                <>
                  <p className="tarot-orientation">{model.insights.tarot.orientation === 'reversed' ? 'Lá ngược' : 'Lá xuôi'}</p>
                  <p>{model.insights.tarot.meaning}</p>
                </>
              ) : <p>{tarotError || 'Bộ bài hiện chưa sẵn sàng.'}</p>}
            </InsightCard>
            <InsightCard
              className="tuvi-card"
              title={model.insights.tuvi.title}
              label={model.insights.tuvi.label}
              body={model.insights.tuvi.body}
              href={model.insights.tuvi.href}
              linkText="Mở TuViNow"
            />
          </div>
        </section>

        <section className="apps-section" aria-labelledby="apps-heading">
          <div className="section-heading">
            <div><p className="eyebrow">TIẾP TỤC KHÁM PHÁ</p><h2 id="apps-heading">Ứng dụng SpiritNow</h2></div>
          </div>
          <div className="app-link-grid">
            {model.apps.map((app) => (
              <a className="app-link-card" href={appHref(app.href)} key={app.id}>
                <span>{app.label}</span><span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <AppFooter compact showApps={false} tagline="Một nơi để tiếp tục hành trình qua Kinh Dịch, Tarot, Tử Vi và ghi chú." />
    </div>
  );
}

export default App;
