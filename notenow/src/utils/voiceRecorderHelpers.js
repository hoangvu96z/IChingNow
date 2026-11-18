export const VOICE_RECORDER_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

export function isVoiceRecordingSupported(
  nav = globalThis.navigator,
  Recorder = globalThis.MediaRecorder,
) {
  return Boolean(
    nav?.mediaDevices &&
      typeof nav.mediaDevices.getUserMedia === 'function' &&
      typeof Recorder !== 'undefined',
  );
}

export function selectSupportedAudioMimeType(Recorder = globalThis.MediaRecorder) {
  if (!Recorder || typeof Recorder.isTypeSupported !== 'function') return '';
  for (const candidate of VOICE_RECORDER_MIME_CANDIDATES) {
    try {
      if (Recorder.isTypeSupported(candidate)) return candidate;
    } catch {}
  }
  return '';
}

export function resolveRecordedFileFormat(mimeType) {
  const base = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (
    base === 'audio/mp4' ||
    base === 'video/mp4' ||
    base === 'audio/x-m4a' ||
    base === 'audio/m4a' ||
    base === 'audio/aac'
  ) {
    return { ext: 'm4a', type: 'audio/mp4' };
  }
  if (base === 'audio/ogg' || base === 'application/ogg' || base === 'audio/opus') {
    return { ext: 'ogg', type: 'audio/ogg' };
  }
  return { ext: 'webm', type: 'audio/webm' };
}

export function formatVoiceRecordingFilename(ext = 'webm', date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const hms = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `ghi-am-${ymd}-${hms}.${ext}`;
}

export function stopMediaStreamTracks(stream) {
  if (!stream || typeof stream.getTracks !== 'function') return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {}
  });
}
