import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  VOICE_RECORDER_MIME_CANDIDATES,
  isVoiceRecordingSupported,
  selectSupportedAudioMimeType,
  resolveRecordedFileFormat,
  formatVoiceRecordingFilename,
  stopMediaStreamTracks,
} from '../utils/voiceRecorderHelpers.js';

export {
  VOICE_RECORDER_MIME_CANDIDATES,
  isVoiceRecordingSupported,
  selectSupportedAudioMimeType,
  resolveRecordedFileFormat,
  formatVoiceRecordingFilename,
  stopMediaStreamTracks,
};

const MAX_RECORDING_SECONDS = 300; // 5 minutes
const MAX_RECORDING_BYTES = 19 * 1024 * 1024; // ~19MB (< 20MB backend cap)

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function VoiceRecorderButton({
  disabled = false,
  onRecordingComplete,
  onError,
}) {
  const { t } = useLanguage();
  const [supported] = useState(() => isVoiceRecordingSupported());
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const totalBytesRef = useRef(0);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);

  const cleanupRecordingResources = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    stopMediaStreamTracks(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      clearInterval(timerRef.current);
      try {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      } catch {}
      stopMediaStreamTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const stopRecorder = useCallback((cancel = false) => {
    cancelledRef.current = cancel;
    clearInterval(timerRef.current);
    timerRef.current = null;
    const activeRecorder = recorderRef.current;
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      try {
        if (!cancel && typeof activeRecorder.requestData === 'function') {
          try {
            activeRecorder.requestData();
          } catch {}
        }
        activeRecorder.stop();
        return;
      } catch {}
    }
    cleanupRecordingResources();
    if (mountedRef.current) {
      setIsRecording(false);
      setElapsedSeconds(0);
    }
  }, [cleanupRecordingResources]);

  const startRecording = async () => {
    if (disabled || isRecording) return;
    if (!supported) {
      onError?.(
        t(
          'editor.voice_unsupported',
          'Trình duyệt hiện tại chưa hỗ trợ ghi âm trực tiếp từ micro. Vui lòng dùng nút đính kèm tệp âm thanh bên cạnh.',
        ),
      );
      return;
    }
    cancelledRef.current = false;
    chunksRef.current = [];
    totalBytesRef.current = 0;

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stopMediaStreamTracks(stream);
        return;
      }
      streamRef.current = stream;

      const selectedMime = selectSupportedAudioMimeType();
      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          totalBytesRef.current += event.data.size;
          if (totalBytesRef.current >= MAX_RECORDING_BYTES) {
            stopRecorder(false);
          }
        }
      };

      recorder.onerror = () => {
        cleanupRecordingResources();
        if (mountedRef.current) {
          setIsRecording(false);
          setElapsedSeconds(0);
          onError?.(
            t('editor.voice_record_error', 'Không thể ghi âm từ micro. Vui lòng thử lại.'),
          );
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || selectedMime || 'audio/webm';
        const recordedChunks = chunksRef.current;
        const wasCancelled = cancelledRef.current;
        chunksRef.current = [];
        totalBytesRef.current = 0;
        cleanupRecordingResources();

        if (!mountedRef.current) return;
        setIsRecording(false);
        setElapsedSeconds(0);

        if (wasCancelled) return;
        if (recordedChunks.length === 0) {
          onError?.(
            t(
              'editor.voice_empty_error',
              'Bản ghi âm quá ngắn hoặc chưa thu được tín hiệu âm thanh. Hãy thử lại.',
            ),
          );
          return;
        }

        const { ext, type } = resolveRecordedFileFormat(finalMime);
        const blob = new Blob(recordedChunks, { type });
        if (blob.size === 0) {
          onError?.(
            t(
              'editor.voice_empty_error',
              'Bản ghi âm quá ngắn hoặc chưa thu được tín hiệu âm thanh. Hãy thử lại.',
            ),
          );
          return;
        }
        const filename = formatVoiceRecordingFilename(ext, new Date());
        const file = new File([blob], filename, { type });
        onRecordingComplete?.([file]);
      };

      recorder.start(500);
      setIsRecording(true);
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecorder(false);
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      stopMediaStreamTracks(stream);
      cleanupRecordingResources();
      if (mountedRef.current) {
        setIsRecording(false);
        setElapsedSeconds(0);
        const denied =
          err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        onError?.(
          denied
            ? t(
                'editor.voice_permission_denied',
                'Quyền truy cập micro bị từ chối. Vui lòng cấp quyền micro trong trình duyệt.',
              )
            : t('editor.voice_record_error', 'Không thể khởi động micro trên thiết bị này.'),
        );
      }
    }
  };

  if (isRecording) {
    return (
      <div
        className="nn-voice-recorder-live"
        role="group"
        aria-label={t('editor.voice_recording_group', 'Đang ghi âm giọng nói')}
      >
        <span className="nn-voice-recorder-indicator" aria-live="off">
          <span className="nn-voice-recorder-dot" aria-hidden="true" />
          <span className="nn-voice-recorder-timer">{formatDuration(elapsedSeconds)}</span>
        </span>
        <button
          type="button"
          className="nn-voice-recorder-stop-btn"
          onClick={() => stopRecorder(false)}
          title={t('editor.voice_stop_save', 'Dừng và lưu ghi âm')}
          aria-label={t('editor.voice_stop_save', 'Dừng và lưu ghi âm')}
          id="btn-voice-stop-save"
        >
          <Square size={12} fill="currentColor" aria-hidden="true" />
          <span>{t('editor.voice_save_short', 'Lưu')}</span>
        </button>
        <button
          type="button"
          className="nn-voice-recorder-cancel-btn"
          onClick={() => stopRecorder(true)}
          title={t('editor.voice_cancel', 'Huỷ ghi âm')}
          aria-label={t('editor.voice_cancel', 'Huỷ ghi âm')}
          id="btn-voice-cancel"
        >
          <X size={14} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn btn-ghost btn-icon"
      title={t('editor.voice_record', 'Ghi âm trực tiếp từ micro')}
      aria-label={t('editor.voice_record', 'Ghi âm trực tiếp từ micro')}
      type="button"
      disabled={disabled}
      onClick={startRecording}
      id="btn-voice-record"
    >
      <Mic size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
