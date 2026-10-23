const API_ERRORS = {
  list: 'Failed to load readings',
  create: 'Failed to save reading',
  update: 'Failed to update reading data',
  delete: 'Failed to delete reading',
  clear: 'Không thể xóa lịch sử trên máy chủ. Lịch sử vẫn được giữ lại.',
};

/** Build the shared fetch transport used by apps that talk to SSO directly. */
export function createReadingsApiRequest(baseUrl, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required');
  }

  return async (path, { method = 'GET', body, signal, errorMessage } = {}) => {
    const options = { credentials: 'include' };
    if (method !== 'GET') options.method = method;
    if (signal) options.signal = signal;
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    const response = await fetchImpl(`${baseUrl}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(errorMessage || data.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      throw error;
    }

    return data;
  };
}

/** Shared SSO readings routes and request shapes; transport remains injectable. */
export function createReadingsApi({ app, request }) {
  if (!app || typeof request !== 'function') {
    throw new TypeError('A readings app and request function are required');
  }

  const appQuery = encodeURIComponent(app);

  return {
    list: () => request(`/readings?app=${appQuery}`, { errorMessage: API_ERRORS.list }),
    create: (payload) => request('/readings', {
      method: 'POST',
      body: payload,
      errorMessage: API_ERRORS.create,
    }),
    update: (readingId, data) => request(
      `/readings/${encodeURIComponent(readingId)}`,
      {
        method: 'PATCH',
        body: { data },
        errorMessage: API_ERRORS.update,
      },
    ),
    delete: async (readingId) => {
      await request(`/readings/${encodeURIComponent(readingId)}`, {
        method: 'DELETE',
        errorMessage: API_ERRORS.delete,
      });
      return { ok: true };
    },
    clear: () => request(`/readings/all?app=${appQuery}`, {
      method: 'DELETE',
      errorMessage: API_ERRORS.clear,
    }),
  };
}
