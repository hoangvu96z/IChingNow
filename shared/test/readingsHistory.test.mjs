import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { createServer } from '../../iching/node_modules/vite/dist/node/index.js';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const legacyCiphertext = 'enc_v1::AAECAwQFBgcICQoL:LzAhZMRgJTSGIC5mC2kzY3rdgcfBh+f9Oenf';
const legacyAccountId = 'account-123';

function createReactHookHarness() {
  let activeInstance = null;

  globalThis.__TEST_REACT_HOOKS__ = {
    useState(initialValue) {
      const instance = activeInstance;
      const index = instance.cursor++;
      if (!(index in instance.states)) {
        instance.states[index] =
          typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      const setState = (updater) => {
        const current = instance.states[index];
        instance.states[index] =
          typeof updater === 'function' ? updater(current) : updater;
        instance.render();
      };
      return [instance.states[index], setState];
    },
    useCallback(fn, deps) {
      const instance = activeInstance;
      const index = instance.cursor++;
      const prev = instance.callbacks[index];
      if (
        prev &&
        Array.isArray(deps) &&
        Array.isArray(prev.deps) &&
        deps.length === prev.deps.length &&
        deps.every((dep, i) => Object.is(dep, prev.deps[i]))
      ) {
        return prev.fn;
      }
      instance.callbacks[index] = { fn, deps };
      return fn;
    },
  };

  return function mountHook(renderFn, initialProps) {
    const instance = {
      states: [],
      callbacks: [],
      cursor: 0,
      props: initialProps,
      current: null,
      render(nextProps = instance.props) {
        instance.props = nextProps;
        instance.cursor = 0;
        const prev = activeInstance;
        activeInstance = instance;
        try {
          instance.current = renderFn(instance.props);
          return instance.current;
        } finally {
          activeInstance = prev;
        }
      },
    };
    instance.render(initialProps);
    return instance;
  };
}

async function createAppHookServer(appDir) {
  const root = path.resolve(repoRoot, appDir);
  return createServer({
    root,
    configFile: false,
    plugins: [
      {
        name: 'virtual-react-hook-shim',
        enforce: 'pre',
        resolveId(id) {
          if (id === 'react') return '\0virtual:react-hook-shim';
          return null;
        },
        load(id) {
          if (id === '\0virtual:react-hook-shim') {
            return `
              export function useState(initialValue) {
                return globalThis.__TEST_REACT_HOOKS__.useState(initialValue);
              }
              export function useCallback(fn, deps) {
                return globalThis.__TEST_REACT_HOOKS__.useCallback(fn, deps);
              }
            `;
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: {
        '@shared': path.resolve(repoRoot, 'shared/src'),
      },
    },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: {
      middlewareMode: true,
      hmr: false,
      ws: false,
      watch: null,
      fs: { allow: [repoRoot] },
    },
    appType: 'custom',
  });
}

test('IChing and Tarot useReadingsApi preserve public contracts, decrypt fallbacks, and save/duplicate semantics', async () => {
  const mountHook = createReactHookHarness();
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  globalThis.window = { crypto: webcrypto };
  console.error = () => {};
  console.warn = () => {};

  const ichingServer = await createAppHookServer('iching');
  const tarotServer = await createAppHookServer('tarotnow');

  try {
    const { useReadingsApi: useIChingReadingsApi } =
      await ichingServer.ssrLoadModule('/src/hooks/useReadingsApi.js');
    const { useReadingsApi: useTarotReadingsApi } =
      await tarotServer.ssrLoadModule('/src/hooks/useReadingsApi.js');

    // 1. Unauthenticated behavior & public return keys
    let fetchCalls = [];
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return new Response(JSON.stringify({ readings: [] }), { status: 200 });
    };

    const guestIChing = mountHook(
      ({ auth, uid }) => useIChingReadingsApi(auth, uid),
      { auth: false, uid: null },
    );
    assert.deepEqual(Object.keys(guestIChing.current).sort(), [
      'clearHistory',
      'deleteMultipleReadings',
      'deleteReading',
      'history',
      'historyLoaded',
      'loadHistory',
      'saveReading',
      'setHistory',
      'updateReadingData',
    ]);
    assert.deepEqual(guestIChing.current.history, []);
    assert.equal(guestIChing.current.historyLoaded, false);

    await guestIChing.current.loadHistory();
    assert.equal(guestIChing.current.historyLoaded, true);
    assert.deepEqual(guestIChing.current.history, []);
    assert.equal(
      await guestIChing.current.saveReading({ primaryHexagram: { nameVi: 'Càn' } }, 'luc-hao'),
      null,
    );
    assert.equal(fetchCalls.length, 0);

    // 2. IChing loadHistory: legacy decryption, fallback strings, and mode mapping
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return new Response(
        JSON.stringify({
          readings: [
            {
              id: 'ic-1',
              createdAt: '2026-10-20T10:00:00.000Z',
              question: legacyCiphertext,
              type: 'luc-hao',
              title: 'Thuần Càn',
              data: {
                question: legacyCiphertext,
                aiConversation: legacyCiphertext,
                mode: 'coins',
              },
            },
            {
              id: 'ic-2',
              createdAt: '2026-10-21T10:00:00.000Z',
              question: 'enc_v1::corrupted',
              type: 'mai-hoa',
              title: '',
              data: {
                question: 'enc_v1::corrupted',
                aiConversation: 'enc_v1::corrupted',
              },
            },
            {
              id: 'ic-3',
              createdAt: '2026-10-22T10:00:00.000Z',
              question: '',
              type: 'quick',
              title: 'Quẻ Nhanh',
              data: {},
            },
            {
              id: 'ic-4',
              createdAt: '2026-10-22T12:00:00.000Z',
              question: 'enc_v1::corrupted',
              type: 'luc-hao',
              title: 'Quẻ Càn biến Cấu',
              data: {
                question: 'Câu hỏi dự phòng từ data',
              },
            },
          ],
        }),
        { status: 200 },
      );
    };

    const iching = mountHook(
      ({ auth, uid }) => useIChingReadingsApi(auth, uid),
      { auth: true, uid: legacyAccountId },
    );
    await iching.current.loadHistory();

    assert.equal(fetchCalls[0].url, '/readings?app=iching');
    assert.equal(iching.current.historyLoaded, true);
    assert.equal(iching.current.history.length, 4);

    // ic-1 decrypted cleanly
    assert.deepEqual(iching.current.history[0], {
      id: 'ic-1',
      timestamp: '2026-10-20T10:00:00.000Z',
      question: 'legacy-v1',
      type: 'luc-hao',
      title: 'Thuần Càn',
      mode: 'coins',
      data: {
        question: 'legacy-v1',
        aiConversation: 'legacy-v1',
        mode: 'coins',
      },
      _remoteId: 'ic-1',
    });
    assert.equal('_decryptionError' in iching.current.history[0], false);

    // ic-2 failed decryption -> fallback '(Lần lập quẻ)', mode falls back to type, _decryptionError: true
    assert.deepEqual(iching.current.history[1], {
      id: 'ic-2',
      timestamp: '2026-10-21T10:00:00.000Z',
      question: '(Lần lập quẻ)',
      type: 'mai-hoa',
      title: '',
      mode: 'mai-hoa',
      data: {
        question: 'enc_v1::corrupted',
        aiConversation: 'enc_v1::corrupted',
      },
      _remoteId: 'ic-2',
      _decryptionError: true,
    });

    // ic-3 empty question -> '(Không có câu hỏi)'
    assert.equal(iching.current.history[2].question, '(Không có câu hỏi)');
    assert.equal(iching.current.history[2].mode, 'quick');

    // ic-4 failed top-level decryption with r.title present -> uses r.title and marks _decryptionError
    assert.equal(iching.current.history[3].question, 'Quẻ Càn biến Cấu');
    assert.equal(iching.current.history[3]._decryptionError, true);

    // 3. IChing saveReading: payload shape, title/mode formatting, and createdAt duplicate suppression
    const createPayloads = [];
    let createSeq = 0;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/readings');
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      createPayloads.push(body);
      createSeq += 1;
      return new Response(
        JSON.stringify({ reading: { id: `saved-ic-${createSeq}` } }),
        { status: 200 },
      );
    };

    const maiHoaResult = {
      createdAt: '2026-10-24T08:00:00.000Z',
      question: '',
      subMode: 'time',
      primaryHexagram: { nameVi: 'Thiên Phong Cấu' },
      changedHexagram: { nameVi: 'Thuần Càn' },
    };
    const savedMaiHoa = await iching.current.saveReading(maiHoaResult, 'mai-hoa');
    assert.equal(savedMaiHoa.id, 'saved-ic-1');
    assert.equal(savedMaiHoa._remoteId, 'saved-ic-1');
    assert.equal(savedMaiHoa.title, 'Thiên Phong Cấu (Chủ) ➔ Thuần Càn (Biến)');
    assert.equal(savedMaiHoa.mode, 'mai-hoa-time');
    assert.equal(savedMaiHoa.question, '(Không có câu hỏi)');
    assert.equal(savedMaiHoa.timestamp, '2026-10-24T08:00:00.000Z');
    assert.deepEqual(createPayloads[0], {
      app: 'iching',
      type: 'mai-hoa',
      question: null,
      title: 'Thiên Phong Cấu (Chủ) ➔ Thuần Càn (Biến)',
      data: { ...maiHoaResult, question: null },
    });
    assert.equal(iching.current.history.length, 5);
    assert.equal(iching.current.history[0].id, 'saved-ic-1');

    // Saving again with the same data.createdAt should NOT insert a duplicate into IChing history
    const duplicateSave = await iching.current.saveReading(maiHoaResult, 'mai-hoa');
    assert.equal(duplicateSave.id, 'saved-ic-2');
    assert.equal(iching.current.history.length, 5);
    assert.equal(iching.current.history[0].id, 'saved-ic-1');

    // luc-hao title formatting with changedHexagram
    const lucHaoResult = {
      createdAt: '2026-10-24T08:30:00.000Z',
      question: 'Hỏi công việc',
      primaryHexagram: { nameVi: 'Thuần Càn' },
      changedHexagram: { nameVi: 'Thiên Phong Cấu' },
    };
    const savedLucHao = await iching.current.saveReading(lucHaoResult, 'luc-hao');
    assert.equal(savedLucHao.title, 'Thuần Càn ➔ Thiên Phong Cấu');
    assert.equal(savedLucHao.mode, 'quick');
    assert.equal(savedLucHao.question, 'Hỏi công việc');
    assert.equal(iching.current.history.length, 6);

    // 4. Tarot loadHistory and saveReading: spread/cards mapping, fallbacks, and NO createdAt duplicate suppression
    globalThis.fetch = async (url) => {
      assert.equal(url, '/readings?app=tarot');
      return new Response(
        JSON.stringify({
          readings: [
            {
              id: 'tr-1',
              createdAt: '2026-10-23T09:00:00.000Z',
              question: 'enc_v1::unreadable',
              type: 'celtic-cross',
              title: '',
              data: {
                question: 'enc_v1::unreadable',
                cards: [{ id: 'the-fool' }],
              },
            },
            {
              id: 'tr-2',
              createdAt: '2026-10-23T11:00:00.000Z',
              question: null,
              type: 'three-card',
              title: 'Quá khứ - Hiện tại - Tương lai',
              data: {},
            },
          ],
        }),
        { status: 200 },
      );
    };

    const tarot = mountHook(
      ({ auth, uid }) => useTarotReadingsApi(auth, uid),
      { auth: true, uid: legacyAccountId },
    );
    await tarot.current.loadHistory();

    assert.equal(tarot.current.historyLoaded, true);
    assert.deepEqual(tarot.current.history[0], {
      id: 'tr-1',
      timestamp: '2026-10-23T09:00:00.000Z',
      question: '(Trải bài Tarot)',
      spread: 'celtic-cross',
      title: '',
      cards: [{ id: 'the-fool' }],
      data: {
        question: 'enc_v1::unreadable',
        cards: [{ id: 'the-fool' }],
      },
      _remoteId: 'tr-1',
      _decryptionError: true,
    });
    assert.deepEqual(tarot.current.history[1], {
      id: 'tr-2',
      timestamp: '2026-10-23T11:00:00.000Z',
      question: '',
      spread: 'three-card',
      title: 'Quá khứ - Hiện tại - Tương lai',
      cards: [],
      data: {},
      _remoteId: 'tr-2',
    });

    const tarotCreates = [];
    let tarotSeq = 0;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/readings');
      assert.equal(options.method, 'POST');
      tarotCreates.push(JSON.parse(options.body));
      tarotSeq += 1;
      return new Response(
        JSON.stringify({ reading: { id: `saved-tr-${tarotSeq}` } }),
        { status: 200 },
      );
    };

    const tarotEntry = {
      createdAt: '2026-10-24T09:00:00.000Z',
      spread: '',
      title: '',
      question: '',
      cards: [{ name: 'The Magician' }],
      data: { createdAt: '2026-10-24T09:00:00.000Z' },
    };
    const firstTarotSave = await tarot.current.saveReading(tarotEntry);
    const secondTarotSave = await tarot.current.saveReading(tarotEntry);

    assert.equal(firstTarotSave.id, 'saved-tr-1');
    assert.equal(secondTarotSave.id, 'saved-tr-2');
    assert.deepEqual(tarotCreates[0], {
      app: 'tarot',
      type: 'custom',
      question: null,
      title: 'Trải bài ',
      data: { ...tarotEntry, question: null },
    });
    // Both entries are kept in Tarot history (no createdAt duplicate suppression)
    assert.equal(tarot.current.history.length, 4);
    assert.equal(tarot.current.history[0].id, 'saved-tr-2');
    assert.equal(tarot.current.history[1].id, 'saved-tr-1');

    // 5. updateReadingData guards undecryptable records and patches decryptable records
    let patchCalls = 0;
    globalThis.fetch = async (url, options) => {
      patchCalls += 1;
      assert.equal(url, '/readings/ic-1');
      assert.equal(options.method, 'PATCH');
      assert.deepEqual(JSON.parse(options.body), {
        data: { aiConversation: [{ role: 'assistant', content: 'Luận giải mới' }] },
      });
      return new Response(
        JSON.stringify({ reading: { id: 'ic-1', updated: true } }),
        { status: 200 },
      );
    };

    await assert.rejects(
      iching.current.updateReadingData('ic-2', { aiConversation: [] }),
      /Không thể giải mã dữ liệu đã lưu/,
    );
    assert.equal(patchCalls, 0);

    const updatedReading = await iching.current.updateReadingData('ic-1', {
      aiConversation: [{ role: 'assistant', content: 'Luận giải mới' }],
    });
    assert.deepEqual(updatedReading, { id: 'ic-1', updated: true });
    assert.equal(patchCalls, 1);
    const updatedItem = iching.current.history.find((item) => item.id === 'ic-1');
    assert.deepEqual(updatedItem.data.aiConversation, [
      { role: 'assistant', content: 'Luận giải mới' },
    ]);

    // 6. deleteReading, deleteMultipleReadings (with failedIds), and clearHistory
    globalThis.fetch = async (url, options) => {
      assert.equal(options.method, 'DELETE');
      if (url === '/readings/ic-2') {
        return new Response(JSON.stringify({ message: 'server error' }), { status: 503 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    // Single delete failure retains item and throws
    const itemIc2 = iching.current.history.find((item) => item.id === 'ic-2');
    await assert.rejects(
      iching.current.deleteReading(itemIc2),
      /Không thể xóa bản ghi trên máy chủ/,
    );
    assert.ok(iching.current.history.some((item) => item.id === 'ic-2'));

    // Single delete success removes item
    const itemIc3 = iching.current.history.find((item) => item.id === 'ic-3');
    await iching.current.deleteReading(itemIc3);
    assert.equal(iching.current.history.some((item) => item.id === 'ic-3'), false);

    // Multi-delete partial failure removes succeeded items and attaches failedIds
    const itemIc1 = iching.current.history.find((item) => item.id === 'ic-1');
    await assert.rejects(
      iching.current.deleteMultipleReadings([itemIc1, itemIc2]),
      (error) => {
        assert.match(error.message, /Không thể xóa 1 bản ghi trên máy chủ/);
        assert.deepEqual(error.failedIds, ['ic-2']);
        return true;
      },
    );
    assert.equal(iching.current.history.some((item) => item.id === 'ic-1'), false);
    assert.equal(iching.current.history.some((item) => item.id === 'ic-2'), true);

    // clearHistory calls DELETE /readings/all?app=iching and empties history
    let clearedUrl = null;
    globalThis.fetch = async (url, options) => {
      clearedUrl = `${options.method} ${url}`;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    await iching.current.clearHistory();
    assert.equal(clearedUrl, 'DELETE /readings/all?app=iching');
    assert.deepEqual(iching.current.history, []);
  } finally {
    await ichingServer.close();
    await tarotServer.close();
    delete globalThis.__TEST_REACT_HOOKS__;
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
});
