import { useEffect, useState } from 'react';
import { notesApi } from '../api.js';
import { getLocalNoteAudioSource } from '../noteImages.mjs';

const EMPTY_AUDIOS = [];

export function useNoteAudioSources(audios, noteId, shareToken, guestOwned = false) {
  const audioList = Array.isArray(audios) ? audios : EMPTY_AUDIOS;
  const [loaded, setLoaded] = useState({ audios: null, noteId: null, shareToken: null, guestOwned: false, sources: [], failedCount: 0, loading: true });

  useEffect(() => {
    let disposed = false;
    const objectUrls = [];
    setLoaded({ audios: audioList, noteId, shareToken, guestOwned, sources: [], failedCount: 0, loading: true });

    Promise.all(audioList.map(async (audio) => {
      const localSource = getLocalNoteAudioSource(audio);
      if (localSource) return localSource;

      try {
        const blob = await notesApi.fetchAudio({ noteId, shareToken, audio, guestOwned });
        const normalizedBlob =
          (!blob.type || blob.type === 'application/octet-stream') && audio?.mimeType
            ? new Blob([blob], { type: audio.mimeType })
            : blob;
        const objectUrl = URL.createObjectURL(normalizedBlob);
        objectUrls.push(objectUrl);
        return objectUrl;
      } catch {
        return '';
      }
    })).then((sources) => {
      if (disposed) {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setLoaded({
        audios: audioList,
        noteId,
        shareToken,
        guestOwned,
        sources,
        failedCount: sources.filter((source) => !source).length,
        loading: false,
      });
    });

    return () => {
      disposed = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [audioList, noteId, shareToken, guestOwned]);

  if (loaded.audios !== audioList || loaded.noteId !== noteId || loaded.shareToken !== shareToken || loaded.guestOwned !== guestOwned) {
    return { sources: [], failedCount: 0, loading: true };
  }
  return { sources: loaded.sources, failedCount: loaded.failedCount, loading: loaded.loading };
}
