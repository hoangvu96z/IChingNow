function getErrorMessage(error) {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (typeof error?.message === 'string' && error.message.trim()) return error.message.trim();
  return 'Dịch vụ AI không thể hoàn tất yêu cầu.';
}

/** Read an OpenAI-compatible chat completion stream and reject incomplete/error streams. */
export async function readOpenAiChatStream(response) {
  if (!response?.body) throw new Error('AI proxy returned an empty stream');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let text = '';
  let completed = false;

  const processLine = (rawLine) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (!line.startsWith('data:')) return;

    const payload = line.slice(5).replace(/^ /, '').trim();
    if (!payload) return;
    if (payload === '[DONE]') {
      completed = true;
      return;
    }

    let event;
    try {
      event = JSON.parse(payload);
    } catch {
      throw new Error('Phản hồi luồng AI không hợp lệ. Vui lòng thử lại.');
    }

    if (event?.error) throw new Error(getErrorMessage(event.error));
    const choices = event?.choices;
    if (!Array.isArray(choices)) {
      throw new Error('Phản hồi luồng AI không đúng định dạng. Vui lòng thử lại.');
    }
    const content = choices[0]?.delta?.content;
    if (typeof content === 'string') text += content;
  };

  try {
    while (!completed) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: !done });
      else if (done) buffer += decoder.decode();

      let boundary = buffer.indexOf('\n');
      while (boundary !== -1) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 1);
        processLine(line);
        if (completed) break;
        boundary = buffer.indexOf('\n');
      }

      if (done) {
        if (!completed && buffer) processLine(buffer);
        break;
      }
    }

    if (!completed) throw new Error('Phản hồi AI bị ngắt quãng trước khi hoàn tất. Vui lòng thử lại.');
    return text;
  } catch (error) {
    try {
      await reader.cancel(error);
    } catch {}
    throw error;
  }
}
