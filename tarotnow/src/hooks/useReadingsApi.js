import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import { decryptData } from '../utils/cryptoUtils';
import {
  createReadingsApi,
  createReadingsApiRequest,
} from '../../../shared/src/utils/readingsApi.mjs';
import { useReadingsHistory } from '../../../shared/src/hooks/useReadingsHistory.js';

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });
const APP = 'tarot';
const readingsApi = createReadingsApi({
  app: APP,
  request: createReadingsApiRequest(SSO_BASE),
});

function mapLoadedTarotReading(r, dataObj) {
  return {
    spread: r.type,
    title: r.title,
    cards: dataObj.cards || [],
  };
}

function buildTarotSaveReading(newEntry) {
  const plainQuestion = newEntry.question || null;
  const dataToSave = { ...newEntry, question: plainQuestion };

  return {
    payload: {
      app: APP,
      type: newEntry.spread || 'custom',
      question: plainQuestion,
      title: newEntry.title || `Trải bài ${newEntry.spread || ''}`,
      data: dataToSave,
    },
    localItem: newEntry,
  };
}

export function useReadingsApi(isAuthenticated, userId) {
  return useReadingsHistory(isAuthenticated, userId, {
    readingsApi,
    decryptData,
    encryptedQuestionFallback: '(Trải bài Tarot)',
    emptyQuestionFallback: '',
    mapLoadedReading: mapLoadedTarotReading,
    buildSaveReading: buildTarotSaveReading,
  });
}
