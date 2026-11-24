import TuViEvidenceProvider from './components/TuViEvidenceProvider';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { anLaSoTuVi } from './utils/tuViEngine';
import BirthInputForm, { buildBirthInputPayload } from './components/BirthInputForm.jsx';
import BirthHourRectifierModal from './components/BirthHourRectifierModal.jsx';
import LasoChart from './components/LasoChart.jsx';
import TuViOverviewDashboard from './components/TuViOverviewDashboard.jsx';
import TuViAiPanel from './components/TuViAiPanel.jsx';
import HopHonPage from './components/HopHonPage.jsx';
import HuyenKhongPage from './components/HuyenKhongPage.jsx';
import { useReadingsApi } from './hooks/useReadingsApi';
import { getHistoryRestoreError } from './utils/historyRestore.js';
import TuViHistoryModal from './components/TuViHistoryModal.jsx';
import HistoryLoadErrorNotice from './components/HistoryLoadErrorNotice.mjs';
import AppHeader from '@shared/components/AppHeader.jsx';
import AppFooter from '@shared/components/AppFooter.jsx';
import { tuviTheme } from '@shared/themes/tuvi.js';
import { trackPageVisit } from '@shared/utils/analytics.js';
import ShareCard from './components/ShareCard.jsx';
import { useStreak } from '@shared/utils/useStreak.js';
import CombinedReadingModal from '@shared/components/CombinedReading/CombinedReadingModal.jsx';
import SpiritualJournal from '@shared/components/SpiritualJournal.jsx';
import GuidedTour from '@shared/components/GuidedTour.jsx';
import SaveToNoteNowButton from '../../shared/src/components/SaveToNoteNowButton.jsx';
import SavedProfilesBar from './components/SavedProfilesBar.jsx';
import { buildTuViNoteNowPayload } from './utils/noteNowPayload.js';
import {
  loadSavedProfiles,
  replaceSavedProfiles,
  reconcileProfilesFromReadings,
  getDefaultSelfProfile,
  findMatchingProfileForInput,
  profileToBirthFormState,
  profileToBirthInputPayload,
  saveProfile,
  upsertProfileLifeEvent,
  deleteProfileLifeEvent,
  extractProfileDraftFromInputData,
  normalizeLifeEvent,
} from './utils/tuviProfiles.js';

function computePureNatalChart(baseInput, candidateResult) {
  if (!baseInput) return candidateResult || null;
  if (
    candidateResult &&
    !candidateResult.viewYear &&
    Array.isArray(candidateResult.palates) &&
    candidateResult.palates.length === 12
  ) {
    return candidateResult;
  }
  try {
    const pure = anLaSoTuVi({
      ...baseInput,
      viewYear: undefined,
      viewYearCanIndex: undefined,
      viewYearChiIndex: undefined,
    });
    if (pure && Array.isArray(pure.palates) && pure.palates.length === 12) {
      return pure;
    }
  } catch {
    // Fallback to candidateResult if natal recalculation fails
  }
  return candidateResult || null;
}

// Generate star particles for background
function StarParticles() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      size: `${1 + Math.random() * 2}px`,
    }));
  }, []);

  return (
    <div className="stars-container">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star-particle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            '--duration': s.duration,
            '--delay': s.delay,
          }}
        />
      ))}
    </div>
  );
}

// Theme toggle button component
function ThemeToggleButton({ theme, onToggle }) {
  const isLight = theme === 'light';
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={isLight ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
      aria-label={isLight ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
      type="button"
      id="theme-toggle-btn"
    >
      <span aria-hidden="true">{isLight ? '🌙' : '☀️'}</span>
    </button>
  );
}

function ReadingSession({
  result,
  natalResultRef,
  inputData,
  inputDataRef,
  reading,
  persistReading,
  ensureChartSaved,
  onSaved,
  yunxianState,
  onYunxianChange,
  lifeEvents = [],
}) {
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const savedId = useRef(reading?.id || null);
  useEffect(() => {
    if (reading?.id) {
      savedId.current = reading.id;
    }
  }, [reading?.id]);

  const save = async (aiConversation) => {
    if (!savedId.current) savedId.current = await ensureChartSaved();
    const baseResult = natalResultRef?.current || result;
    const latestInput = inputDataRef?.current || inputData;
    const id = await persistReading(savedId.current, {
      result: baseResult,
      inputData: latestInput,
      aiConversation,
    });
    savedId.current = id;
    if (active.current) onSaved(id, aiConversation);
  };
  return (
    <TuViAiPanel
      result={result}
      inputData={inputData}
      initialConversation={reading?.data?.aiConversation}
      onSave={save}
      yunxianState={yunxianState}
      onYunxianChange={onYunxianChange}
      lifeEvents={lifeEvents}
    />
  );
}

function resolvePageFromHash(hash = '') {
  if (hash === '#hop-hon') return 'hop-hon';
  if (hash === '#huyen-khong') return 'huyen-khong';
  return 'la-so';
}

export default function App() {
  const [page, setPage] = useState(() =>
    typeof window !== 'undefined' ? resolvePageFromHash(window.location.hash) : 'la-so'
  );
  useEffect(() => {
    const update = () => setPage(resolvePageFromHash(window.location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tuvinow_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tuvinow_theme', theme);
  }, [theme]);

  useEffect(() => {
    trackPageVisit('tuvi');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('tuvinow_theme', next);
      return next;
    });
  }, []);

  const { user, isAuthenticated, login } = useAuth();
  const profileScopeKey = isAuthenticated && user?.id ? String(user.id) : '';
  const { history, error: historyError, loading: historyLoading, loadHistory, persistReading, updateFavorite, deleteReading, deleteAllReadings } = useReadingsApi(isAuthenticated, user?.id);
  const { streak, recordActivity } = useStreak('tuvi');
  const [reading, setReading] = useState(null);
  const [sessionId, setSessionId] = useState(0);
  const [historyActionError, setHistoryActionError] = useState('');
  const [chartResult, setChartResult] = useState(null);
  const [inputData, setInputData] = useState(null);
  const [savedProfiles, setSavedProfiles] = useState(() => loadSavedProfiles(undefined, profileScopeKey));
  const [formDraftData, setFormDraftData] = useState(null);
  const [sessionLifeEvents, setSessionLifeEvents] = useState([]);
  const [presetProfile, setPresetProfile] = useState(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hash !== '#hop-hon' &&
      window.location.hash !== '#huyen-khong' &&
      !window.location.search
    ) {
      const def = getDefaultSelfProfile(undefined, profileScopeKey);
      return def ? profileToBirthFormState(def) : null;
    }
    return null;
  });
  const [yunxianState, setYunxianState] = useState({
    mode: 'mingpan',
    daXianChiIndex: null,
    viewYear: null,
    lunarMonth: null,
  });

  const natalChartResultRef = useRef(null);
  const inFlightSavePromiseRef = useRef(null);
  const readingIdRef = useRef(null);
  const latestAiConversationRef = useRef(null);
  const inputDataRef = useRef(null);

  useEffect(() => {
    inputDataRef.current = inputData;
  }, [inputData]);

  useEffect(() => {
    readingIdRef.current = reading?.id || null;
    if (reading?.data?.aiConversation !== undefined) {
      latestAiConversationRef.current = reading.data.aiConversation;
    }
  }, [reading]);

  // Reload user-scoped profiles when auth user changes
  useEffect(() => {
    const loaded = loadSavedProfiles(undefined, profileScopeKey);
    setSavedProfiles(loaded);
    if (
      typeof window !== 'undefined' &&
      window.location.hash !== '#hop-hon' &&
      window.location.hash !== '#huyen-khong' &&
      !window.location.search
    ) {
      const def = getDefaultSelfProfile(undefined, profileScopeKey);
      setPresetProfile(def ? profileToBirthFormState(def) : null);
    }
  }, [profileScopeKey]);

  // Reconcile server-saved tuvi-laso readings' lifeEvents into user-scoped saved profiles
  useEffect(() => {
    if (!isAuthenticated || !user?.id || historyLoading || !Array.isArray(history) || history.length === 0) {
      return;
    }
    const currentLocal = loadSavedProfiles(undefined, profileScopeKey);
    const reconciled = reconcileProfilesFromReadings(currentLocal, history);
    if (JSON.stringify(currentLocal) !== JSON.stringify(reconciled)) {
      const persisted = replaceSavedProfiles(reconciled, undefined, profileScopeKey);
      setSavedProfiles(persisted);
    }
  }, [isAuthenticated, user?.id, profileScopeKey, historyLoading, history]);

  const handleYunxianChange = useCallback((nextState) => {
    setYunxianState((prev) => {
      const merged = { ...prev, ...nextState };
      if (merged.mode === 'liuyue' && (merged.lunarMonth === null || merged.lunarMonth === undefined)) {
        merged.lunarMonth = 1;
      } else if ((merged.mode === 'mingpan' || merged.mode === 'daxian') && nextState.lunarMonth === undefined) {
        merged.lunarMonth = null;
      }
      return merged;
    });

    const targetMode = nextState.mode ?? yunxianState.mode;
    const targetViewYear = nextState.viewYear !== undefined && nextState.viewYear !== null
      ? Number(nextState.viewYear)
      : yunxianState.viewYear;

    if (inputData?.lunarYear && inputData?.lunarMonth && inputData?.lunarDay) {
      if ((targetMode === 'liunian' || targetMode === 'liuyue') && targetViewYear && chartResult?.viewYear !== targetViewYear) {
        try {
          const canIdx = ((targetViewYear - 4) % 10 + 10) % 10;
          const chiIdx = ((targetViewYear - 4) % 12 + 12) % 12;
          const updatedChart = anLaSoTuVi({
            ...inputData,
            viewYear: targetViewYear,
            viewYearCanIndex: canIdx,
            viewYearChiIndex: chiIdx,
          });
          if (updatedChart && updatedChart.palates) {
            setChartResult(updatedChart);
          }
        } catch (err) {
          console.error('Failed to recalculate chart for target viewYear:', err);
        }
      } else if ((targetMode === 'mingpan' || targetMode === 'daxian') && chartResult?.viewYear) {
        if (natalChartResultRef.current && Array.isArray(natalChartResultRef.current.palates)) {
          setChartResult(natalChartResultRef.current);
        } else {
          try {
            const natalChart = anLaSoTuVi({
              ...inputData,
              viewYear: undefined,
              viewYearCanIndex: undefined,
              viewYearChiIndex: undefined,
            });
            if (natalChart && natalChart.palates) {
              natalChartResultRef.current = natalChart;
              setChartResult(natalChart);
            }
          } catch (err) {
            console.error('Failed to recalculate natal chart:', err);
          }
        }
      }
    }
  }, [inputData, chartResult?.viewYear, yunxianState.mode, yunxianState.viewYear]);

  const [showForm, setShowForm] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showActiveRectifierModal, setShowActiveRectifierModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [retrySave, setRetrySave] = useState(0);

  useEffect(() => {
    const retry = () => setRetrySave(value => value + 1);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  const handleSubmit = useCallback((data) => {
    const normalizedEvents = Array.isArray(data?.lifeEvents)
      ? data.lifeEvents.map(normalizeLifeEvent).sort((a, b) => a.year - b.year)
      : [];
    const normalizedInput = normalizedEvents.length > 0
      ? { ...data, lifeEvents: normalizedEvents }
      : data;

    const result = anLaSoTuVi(normalizedInput);
    const natalBase = computePureNatalChart(normalizedInput, result);
    recordActivity();

    natalChartResultRef.current = natalBase;
    inFlightSavePromiseRef.current = null;
    readingIdRef.current = null;
    latestAiConversationRef.current = null;
    inputDataRef.current = normalizedInput;

    setReading(null);
    setSessionId(value => value + 1);
    setChartResult(result);
    setInputData(normalizedInput);
    setSessionLifeEvents(normalizedEvents);
    setYunxianState({
      mode: result?.viewYear ? 'liunian' : 'mingpan',
      daXianChiIndex: null,
      viewYear: result?.viewYear ? Number(result.viewYear) : new Date().getFullYear(),
      lunarMonth: null,
    });
    setShowForm(false);
    setShowActiveRectifierModal(false);
    setSaveStatus('');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [recordActivity]);

  const handleNewReading = useCallback(() => {
    natalChartResultRef.current = null;
    inFlightSavePromiseRef.current = null;
    readingIdRef.current = null;
    latestAiConversationRef.current = null;
    inputDataRef.current = null;

    setReading(null);
    setSessionId(value => value + 1);
    setChartResult(null);
    setInputData(null);
    setSessionLifeEvents([]);
    if (typeof window !== 'undefined' && !window.location.search) {
      const def = getDefaultSelfProfile(undefined, profileScopeKey);
      setPresetProfile(def ? profileToBirthFormState(def) : null);
    }
    setYunxianState({
      mode: 'mingpan',
      daXianChiIndex: null,
      viewYear: null,
      lunarMonth: null,
    });
    setShowForm(true);
    setShowActiveRectifierModal(false);
    setSaveStatus('');
  }, [profileScopeKey]);

  useEffect(() => { handleNewReading(); }, [user?.id, handleNewReading]);

  // Initial chart save and AI / lifeEvents saves share one in-flight creation request.
  const ensureChartSaved = useCallback((overrideInputData) => {
    if (readingIdRef.current) return Promise.resolve(readingIdRef.current);
    if (inFlightSavePromiseRef.current) return inFlightSavePromiseRef.current;
    const baseResult = natalChartResultRef.current || chartResult;
    const payloadInput = overrideInputData || inputDataRef.current || inputData;
    if (!baseResult || !payloadInput) return Promise.resolve(null);

    setSaveStatus('Đang tự lưu lá số…');
    const pending = persistReading(null, { result: baseResult, inputData: payloadInput });
    inFlightSavePromiseRef.current = pending;
    pending.then(id => {
      if (inFlightSavePromiseRef.current !== pending) return;
      readingIdRef.current = id;
      setReading(prev => ({
        ...prev,
        id,
        data: {
          ...prev?.data,
          result: baseResult,
          inputData: inputDataRef.current || payloadInput,
        },
      }));
      setSaveStatus('Đã tự lưu lá số');
    }).catch(() => {
      if (inFlightSavePromiseRef.current !== pending) return;
      inFlightSavePromiseRef.current = null;
      setSaveStatus('Chưa lưu được lá số. Sẽ thử lại khi kết nối phục hồi.');
    });
    return pending;
  }, [persistReading, chartResult, inputData]);

  useEffect(() => {
    if (chartResult && inputData && isAuthenticated && user?.id && !reading?.id) {
      ensureChartSaved().catch(() => {});
    }
  }, [chartResult, inputData, isAuthenticated, user?.id, reading?.id, ensureChartSaved, retrySave]);

  const openReading = (item) => {
    const restoreError = getHistoryRestoreError(item);
    if (restoreError) {
      setHistoryActionError(restoreError);
      setShowHistoryModal(false);
      return;
    }
    setHistoryActionError('');
    let result = item.data.result;
    let restoredReading = item;
    if (!result || !Array.isArray(result.palates) || result.palates.length !== 12) {
      try {
        result = anLaSoTuVi(item.data.inputData);
        // Old AI text must not be paired with a newly calculated chart.
        restoredReading = { ...item, data: { ...item.data, result, aiConversation: null } };
      } catch {
        setHistoryActionError('Không thể lập lại lá số từ dữ liệu.');
        return;
      }
    }

    const restoredEvents = Array.isArray(item.data?.inputData?.lifeEvents)
      ? item.data.inputData.lifeEvents.map(normalizeLifeEvent).sort((a, b) => a.year - b.year)
      : [];
    const natalBase = computePureNatalChart(item.data.inputData, result);

    natalChartResultRef.current = natalBase;
    inFlightSavePromiseRef.current = null;
    readingIdRef.current = restoredReading?.id || null;
    latestAiConversationRef.current = restoredReading?.data?.aiConversation ?? null;
    inputDataRef.current = item.data.inputData;

    setReading(restoredReading);
    setSessionLifeEvents(restoredEvents);
    setInputData(item.data.inputData);
    setChartResult(result);
    setYunxianState({
      mode: result?.viewYear ? 'liunian' : 'mingpan',
      daXianChiIndex: null,
      viewYear: result?.viewYear ? Number(result.viewYear) : new Date().getFullYear(),
      lunarMonth: null,
    });
    setShowForm(false);
    setShowHistoryModal(false);
    setShowActiveRectifierModal(false);
    setSessionId(value => value + 1);
    setSaveStatus('Đã lưu trong lịch sử');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReading = useCallback(async (id) => {
    await deleteReading(id);
    if (reading?.id === id) {
      readingIdRef.current = null;
      setReading(null);
    }
  }, [deleteReading, reading?.id]);

  const handleDeleteAll = useCallback(async () => {
    await deleteAllReadings();
    readingIdRef.current = null;
    setReading(null);
  }, [deleteAllReadings]);

  const matchedActiveProfile = useMemo(() => {
    if (!inputData || !savedProfiles.length) return null;
    return findMatchingProfileForInput(inputData, undefined, profileScopeKey);
  }, [inputData, savedProfiles, profileScopeKey]);

  const activeLifeEvents = useMemo(() => {
    const profileEvents = Array.isArray(matchedActiveProfile?.lifeEvents)
      ? matchedActiveProfile.lifeEvents
      : [];
    const sessionEvents = Array.isArray(sessionLifeEvents) ? sessionLifeEvents : [];
    if (!profileEvents.length) return sessionEvents;
    if (!sessionEvents.length) return profileEvents;
    const byId = new Map();
    for (const ev of profileEvents) {
      if (ev?.id) byId.set(ev.id, ev);
    }
    for (const ev of sessionEvents) {
      if (ev?.id) byId.set(ev.id, ev);
    }
    return Array.from(byId.values()).sort((a, b) => (a.year || 0) - (b.year || 0));
  }, [matchedActiveProfile, sessionLifeEvents]);

  const syncLifeEventsToServer = useCallback(async (nextInputData) => {
    if (!isAuthenticated || !user?.id) return;
    const baseResult = natalChartResultRef.current || chartResult;
    if (!baseResult || !nextInputData) return;
    try {
      let resolvedReadingId = reading?.id || readingIdRef.current || null;
      if (!resolvedReadingId && inFlightSavePromiseRef.current) {
        resolvedReadingId = await inFlightSavePromiseRef.current;
      }
      if (!resolvedReadingId) {
        resolvedReadingId = await ensureChartSaved(nextInputData);
        if (!resolvedReadingId) return;
      }
      const patchPayload = {
        result: natalChartResultRef.current || baseResult,
        inputData: nextInputData,
      };
      const currentAi = latestAiConversationRef.current ?? reading?.data?.aiConversation;
      if (currentAi !== undefined && currentAi !== null) {
        patchPayload.aiConversation = currentAi;
      }
      setSaveStatus('Đang đồng bộ mốc biến cố…');
      const savedId = await persistReading(resolvedReadingId, patchPayload);
      const finalId = savedId || resolvedReadingId;
      readingIdRef.current = finalId;
      setReading(prev => ({
        ...prev,
        id: finalId,
        data: {
          ...prev?.data,
          ...patchPayload,
        },
      }));
      setSaveStatus('Đã tự lưu lá số & biến cố năm');
    } catch {
      setSaveStatus('Chưa đồng bộ được biến cố lên đám mây. Đã lưu trên thiết bị.');
    }
  }, [isAuthenticated, user?.id, chartResult, reading, ensureChartSaved, persistReading]);

  const handleProfilesChange = useCallback((nextProfiles, savedProf) => {
    setSavedProfiles(nextProfiles);
    if (savedProf && inputDataRef.current) {
      const updated = { ...inputDataRef.current, profileId: savedProf.id };
      inputDataRef.current = updated;
      setInputData(updated);
    }
  }, []);

  const handleSelectSavedProfile = useCallback((profile) => {
    if (!profile) return;
    setPresetProfile(profileToBirthFormState(profile));
    try {
      const payload = profileToBirthInputPayload(profile);
      handleSubmit(payload);
    } catch (err) {
      setHistoryActionError(err.message || 'Không thể mở lá số từ hồ sơ đã chọn.');
    }
  }, [handleSubmit]);

  const handleOpenHopHonPair = useCallback(() => {
    window.location.hash = 'hop-hon';
    setPage('hop-hon');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpsertLifeEvent = useCallback((eventInput) => {
    if (!eventInput) return;
    const normalizedEvent = normalizeLifeEvent(eventInput);
    const existingFiltered = activeLifeEvents.filter((ev) => ev.id !== normalizedEvent.id);
    const nextEvents = [...existingFiltered, normalizedEvent].sort((a, b) => a.year - b.year);

    setSessionLifeEvents(nextEvents);

    const currentInput = inputDataRef.current || inputData;
    let nextInputData = currentInput
      ? { ...currentInput, lifeEvents: nextEvents }
      : null;

    if (matchedActiveProfile) {
      const { profiles: nextList } = upsertProfileLifeEvent(
        matchedActiveProfile.id,
        normalizedEvent,
        undefined,
        profileScopeKey,
      );
      setSavedProfiles(nextList);
      if (nextInputData && !nextInputData.profileId) {
        nextInputData = { ...nextInputData, profileId: matchedActiveProfile.id };
      }
    } else if (currentInput) {
      const draft = extractProfileDraftFromInputData(currentInput, {
        lifeEvents: nextEvents,
      });
      const { profile: autoSaved, profiles: nextList } = saveProfile(
        draft,
        undefined,
        profileScopeKey,
      );
      setSavedProfiles(nextList);
      if (autoSaved && nextInputData) {
        nextInputData = { ...nextInputData, profileId: autoSaved.id };
      }
    }

    if (nextInputData) {
      inputDataRef.current = nextInputData;
      setInputData(nextInputData);
      syncLifeEventsToServer(nextInputData);
    }
  }, [activeLifeEvents, matchedActiveProfile, inputData, profileScopeKey, syncLifeEventsToServer]);

  const handleDeleteLifeEvent = useCallback((eventId) => {
    if (!eventId) return;
    const nextEvents = activeLifeEvents.filter((ev) => ev.id !== eventId);

    if (matchedActiveProfile) {
      const { profiles: nextList } = deleteProfileLifeEvent(
        matchedActiveProfile.id,
        eventId,
        undefined,
        profileScopeKey,
      );
      setSavedProfiles(nextList);
    }
    setSessionLifeEvents(nextEvents);

    const currentInput = inputDataRef.current || inputData;
    if (currentInput) {
      const nextInputData = { ...currentInput, lifeEvents: nextEvents };
      inputDataRef.current = nextInputData;
      setInputData(nextInputData);
      syncLifeEventsToServer(nextInputData);
    }
  }, [activeLifeEvents, matchedActiveProfile, inputData, profileScopeKey, syncLifeEventsToServer]);

  const activeRectifierBaseInput = useMemo(() => {
    if (!inputData) return null;
    const draft = extractProfileDraftFromInputData(inputData);
    const isLunar = draft.calendarType === 'lunar';
    const effectiveLeap = isLunar ? Boolean(draft.isLeapMonth) : false;
    return {
      name: draft.name || 'Đương số',
      day: draft.day,
      month: draft.month,
      year: draft.year,
      hourIndex: draft.hourValue,
      gender: draft.gender,
      calendarType: draft.calendarType,
      isLunar,
      isLeap: effectiveLeap,
      isLeapMonth: effectiveLeap,
      schoolConfig: inputData.schoolConfig,
    };
  }, [inputData]);

  const handleApplyActiveRectification = useCallback((candidate, modalEvents = []) => {
    if (!candidate?.formPatch) return;
    const byId = new Map();
    for (const ev of activeLifeEvents) {
      if (ev?.id) byId.set(ev.id, normalizeLifeEvent(ev));
    }
    if (Array.isArray(modalEvents)) {
      for (const ev of modalEvents) {
        if (ev) {
          const norm = normalizeLifeEvent(ev);
          byId.set(norm.id, norm);
        }
      }
    }
    const mergedLifeEvents = Array.from(byId.values()).sort((a, b) => a.year - b.year);

    const nextIsLunar =
      candidate.formPatch.calendarType === 'lunar' || Boolean(candidate.formPatch.isLunar);
    const nextIsLeap = nextIsLunar
      ? Boolean(candidate.formPatch.isLeap || candidate.formPatch.isLeapMonth)
      : false;

    try {
      const payload = buildBirthInputPayload({
        name: inputData?.name || activeRectifierBaseInput?.name || 'Đương số',
        day: candidate.formPatch.day,
        month: candidate.formPatch.month,
        year: candidate.formPatch.year,
        hourIndex: candidate.formPatch.hourIndex,
        gender: candidate.formPatch.gender,
        calendarType: nextIsLunar ? 'lunar' : 'solar',
        isLunar: nextIsLunar,
        isLeap: nextIsLeap,
        isLeapMonth: nextIsLeap,
        schoolConfig: inputData?.schoolConfig,
      });
      setHistoryActionError('');
      handleSubmit({
        ...payload,
        ...(mergedLifeEvents.length > 0 ? { lifeEvents: mergedLifeEvents } : {}),
      });
    } catch (err) {
      setHistoryActionError(err.message || 'Không thể lập lại lá số với giờ sinh vừa chọn.');
    }
  }, [activeLifeEvents, inputData, activeRectifierBaseInput, handleSubmit]);

  const buildNoteNowPayload = useCallback(() => {
    return buildTuViNoteNowPayload({
      result: chartResult,
      inputData,
      yunxianState,
      lifeEvents: activeLifeEvents,
    });
  }, [chartResult, inputData, yunxianState, activeLifeEvents]);

  return (
    <>
      {/* Animated Background */}
      <div className="app-bg" />
      <StarParticles />

      {/* ===== HEADER ===== */}
      <AppHeader
        appId="tuvi"
        colors={tuviTheme}
        onLogoClick={() => { window.location.hash = 'la-so'; handleNewReading(); }}
        useAuthHook={useAuth}
        onOpenJournal={() => setShowJournal(true)}
        onOpenGuide={() => setShowGuide(true)}
        guideLabel="Hướng dẫn"
        logo={
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt="TuViNow"
            style={{ width: 28, height: 28, borderRadius: 7, display: 'block', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)' }}
          />
        }

        title="TuViNow"
        subtitle="Tử Vi Đẩu Số Online"
        themeToggle={
          <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        }
        primaryAction={page === 'la-so' && chartResult && (
          <button
            type="button"
            className="tuvi-header-new"
            onClick={handleNewReading}
            title="Lập lá số mới"
            aria-label="Lập lá số mới"
          >
            <span aria-hidden="true">✦</span>
            <span className="tuvi-header-btn-label">Lập lá số mới</span>
          </button>
        )}
      />

      {/* Main Content */}
      <main className="app-content">
        <nav className="tuvi-page-nav" aria-label="Chức năng Tử Vi">
          <a href="#la-so" aria-current={page === 'la-so' ? 'page' : undefined}>Lá số cá nhân</a>
          <a href="#hop-hon" aria-current={page === 'hop-hon' ? 'page' : undefined}>♡ Hợp hôn</a>
          <a href="#huyen-khong" aria-current={page === 'huyen-khong' ? 'page' : undefined}>🧭 Huyền Không</a>
        </nav>
        {historyActionError && (
          <div role="alert" style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, color: 'var(--badge-triet-color)', background: 'var(--badge-triet-bg)', border: '1px solid var(--badge-triet-border)' }}>
            ⚠ {historyActionError}
          </div>
        )}
        <HistoryLoadErrorNotice error={historyError} onRetry={loadHistory} />
        {page === 'hop-hon' && <HopHonPage />}
        {page === 'huyen-khong' && <HuyenKhongPage savedProfiles={savedProfiles} />}
        {page === 'la-so' && showForm && !chartResult && (
          <>
            <SavedProfilesBar
              profiles={savedProfiles}
              onProfilesChange={handleProfilesChange}
              activeInputData={null}
              formDraftData={formDraftData}
              onSelectProfile={handleSelectSavedProfile}
              onOpenHopHonPair={handleOpenHopHonPair}
              scopeKey={profileScopeKey}
            />
            <div data-tour="tuvi-form" style={{ width: '100%' }}>
              <BirthInputForm
                onSubmit={handleSubmit}
                presetProfile={presetProfile}
                onDraftChange={setFormDraftData}
              />
            </div>
            {isAuthenticated && history.length > 0 && (
              <div className="tuvi-form-history">
                <div>
                  <strong>Lịch sử lá số ({history.length})</strong>
                  <p>Xem lại lá số và luận giải đã tự lưu.</p>
                </div>
                <button className="tuvi-history-link" type="button" onClick={() => setShowHistoryModal(true)}>
                  Mở lịch sử
                </button>
              </div>
            )}
          </>
        )}

        {page === 'la-so' && chartResult && (
          <>
            <SavedProfilesBar
              profiles={savedProfiles}
              onProfilesChange={handleProfilesChange}
              activeInputData={inputData}
              onSelectProfile={handleSelectSavedProfile}
              onOpenHopHonPair={handleOpenHopHonPair}
              scopeKey={profileScopeKey}
              compact
            />

            <div className="tuvi-chart-toolbar">
              {streak > 0 ? (
                <span className="tuvi-streak-badge" title={`${streak} ngày liên tiếp lập lá số`}>
                  🔥 {streak} ngày liên tiếp
                </span>
              ) : <span />}
              <div className="tuvi-chart-toolbar-actions">
                <button
                  type="button"
                  id="btn-active-rectify-hour"
                  className="tuvi-rectify-hour-btn"
                  onClick={() => setShowActiveRectifierModal(true)}
                  title="Đối chứng các canh giờ sinh lân cận và kiểm chứng bằng biến cố thực tế"
                >
                  <span aria-hidden="true">🕰️</span> Đối chứng giờ sinh
                </button>
                <SaveToNoteNowButton
                  buildPayload={buildNoteNowPayload}
                  isAuthenticated={isAuthenticated}
                  compact
                />
                {/* Nút kết hợp Kinh Dịch */}
                <button
                  type="button"
                  className="tuvi-ask-iching-btn"
                  onClick={() => setShowCombinedModal(true)}
                >
                  <span aria-hidden="true">🔮</span> Hỏi Kinh Dịch
                </button>
                {isAuthenticated && (
                  <div className="tuvi-chart-toolbar-history">
                    <span className="tuvi-auto-save-status" role="status">{saveStatus}</span>
                    <button className="tuvi-history-link" type="button" onClick={() => setShowHistoryModal(true)}>
                      <span aria-hidden="true">📜</span> Lịch sử ({history.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            <TuViEvidenceProvider key={`${user?.id || 'guest'}-${sessionId}`} result={chartResult}>
            <div data-tour="tuvi-chart" style={{ width: '100%' }}>
              <LasoChart
                result={chartResult}
                inputData={inputData}
                yunxianState={yunxianState}
                onYunxianChange={handleYunxianChange}
              />
            </div>
            <ShareCard result={chartResult} inputData={inputData} yunxianState={yunxianState} />
            <TuViOverviewDashboard
              result={chartResult}
              inputData={inputData}
              yunxianState={yunxianState}
              onYunxianChange={handleYunxianChange}
              lifeEvents={activeLifeEvents}
              onUpsertLifeEvent={handleUpsertLifeEvent}
              onDeleteLifeEvent={handleDeleteLifeEvent}
              isAuthenticated={isAuthenticated}
            />
            <ReadingSession
              key={`${user?.id || 'guest'}-${sessionId}`}
              result={chartResult}
              natalResultRef={natalChartResultRef}
              inputData={inputData}
              inputDataRef={inputDataRef}
              reading={reading}
              persistReading={persistReading}
              ensureChartSaved={ensureChartSaved}
              onSaved={(id, aiConversation) => {
                readingIdRef.current = id;
                latestAiConversationRef.current = aiConversation;
                setReading(previous => ({
                  ...previous,
                  id,
                  data: {
                    ...previous?.data,
                    result: natalChartResultRef.current || chartResult,
                    inputData: inputDataRef.current || inputData,
                    aiConversation,
                  },
                }));
                setSaveStatus('Đã tự lưu lá số và hội thoại');
              }}
              yunxianState={yunxianState}
              onYunxianChange={handleYunxianChange}
              lifeEvents={activeLifeEvents}
            />
            </TuViEvidenceProvider>

            {activeRectifierBaseInput && (
              <BirthHourRectifierModal
                isOpen={showActiveRectifierModal}
                onClose={() => setShowActiveRectifierModal(false)}
                baseInput={activeRectifierBaseInput}
                initialEvents={activeLifeEvents}
                onApplyCandidate={handleApplyActiveRectification}
              />
            )}
          </>
        )}
      </main>

      {/* History Modal */}
      <TuViHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        loading={historyLoading}
        onSelect={openReading}
        onDelete={handleDeleteReading}
        onDeleteAll={handleDeleteAll}
        onRefresh={loadHistory}
        onFavorite={updateFavorite}
      />

      {/* Combined Reading Modal (Tử Vi + Kinh Dịch) */}
      <CombinedReadingModal
        isOpen={showCombinedModal}
        onClose={() => setShowCombinedModal(false)}
        chartResult={chartResult}
        inputData={inputData}
        sourceApp="tuvi"
        language="vi"
        isAuthenticated={isAuthenticated}
        onLogin={login}
      />

      <SpiritualJournal
        key={user?.id || 'anonymous'}
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
        isAuthenticated={isAuthenticated}
        userId={user?.id}
        onLogin={login}
        currentApp="tuvi"
      />

      <GuidedTour
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        accentColor={tuviTheme.accent}
        language="vi"
        title="Hướng dẫn sử dụng TuViNow"
        steps={[
          {
            id: 'tuvi-nav',
            selector: '.tuvi-page-nav',
            title: '1. Chọn chế độ xem Tử Vi / Phong thủy',
            body: 'Chuyển nhanh giữa Lá số cá nhân, Hợp hôn đôi lứa hoặc lập Tinh bàn Huyền Không Phi Tinh ngay tại thanh này.',
          },
          {
            id: 'tuvi-form',
            selector: '[data-tour="tuvi-form"]',
            title: '2. Nhập ngày giờ sinh & An lá số',
            body: 'Nhập họ tên, ngày/tháng/năm sinh (Dương hoặc Âm), giờ sinh và giới tính, rồi bấm nút An Lá Số ở cuối form.',
            fallbackNote: 'Bạn đang xem lá số đã lập (hoặc tab khác). Bấm "Lập lá số mới" nếu muốn nhập lại thông tin.',
          },
          {
            id: 'tuvi-chart',
            selector: '[data-tour="tuvi-chart"]',
            title: '3. Xem 12 Cung, Đại Vận & Lưu Niên',
            body: 'Bấm trực tiếp vào sao/cung trên lá số để tra cứu nhanh, hoặc đổi chế độ Bản Mệnh / Đại Hạn / Lưu Niên / Lưu Nguyệt ở thanh phía trên lá số.',
            fallbackNote: 'Sau khi bấm An Lá Số, lá số 12 cung sẽ hiển thị ngay tại đây.',
          },
          {
            id: 'tuvi-export',
            selector: '[data-tour="tuvi-export"]',
            badge: '⭐ Quan trọng nhất',
            title: '4. Copy Prompt cho AI (Khuyên dùng Gemini)',
            body: 'Cuộn xuống cuối trang tới hộp "Xuất dữ liệu luận giải cho AI", chọn chủ đề & bấm "Copy prompt cho AI (Gemini)" — hoàn toàn miễn phí không cần đăng nhập!',
            tip: '💡 Mẹo chuẩn nhất: Dán thẳng prompt vừa copy vào Google Gemini để luận 12 cung, Tứ Hóa và vận hạn chi tiết nhất.',
            ctaLink: { label: 'Mở Google Gemini', href: 'https://gemini.google.com/' },
            fallbackNote: 'Sau khi lập lá số, cuộn xuống cuối trang để lấy prompt copy cho Google Gemini.',
          },
          {
            id: 'tuvi-ai',
            selector: '[data-tour="tuvi-ai"]',
            badge: 'Chỉ tham khảo',
            title: '5. Lưu ý về AI luận giải trực tiếp',
            body: 'Tính năng AI luận giải tích hợp tại trang hiện chưa hoạt động thật sự tốt và chỉ để tham khảo. Hãy ưu tiên copy prompt ở bước 4 sang Google Gemini.',
            fallbackNote: 'Khi đã an lá số, ưu tiên mục Copy prompt ở cuối trang thay cho nút AI trực tiếp.',
          },
        ]}
      />

      {/* ===== FOOTER ===== */}
      <AppFooter
        appId="tuvi"
        showApps={false}
        colors={tuviTheme}
        tagline="Tử Vi Đẩu Số — Lập lá số, luận giải AI và lưu lịch sử khi đăng nhập"
      />
    </>
  );
}
