import { useEffect, useState } from 'react';
import { notesApi } from '../api.js';
import { getLocalNoteImageSource } from '../noteImages.mjs';

const EMPTY_IMAGES = [];

export function useNoteImageSources(images, noteId, shareToken, guestOwned = false) {
  const imageList = Array.isArray(images) ? images : EMPTY_IMAGES;
  const [loaded, setLoaded] = useState({ images: null, noteId: null, shareToken: null, guestOwned: false, sources: [], failedCount: 0, loading: true });

  useEffect(() => {
    let disposed = false;
    const objectUrls = [];
    setLoaded({ images: imageList, noteId, shareToken, guestOwned, sources: [], failedCount: 0, loading: true });

    Promise.all(imageList.map(async (image) => {
      const localSource = getLocalNoteImageSource(image);
      if (localSource) return localSource;

      try {
        const blob = await notesApi.fetchImage({ noteId, shareToken, image, guestOwned });
        const objectUrl = URL.createObjectURL(blob);
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
        images: imageList,
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
  }, [imageList, noteId, shareToken, guestOwned]);

  if (loaded.images !== imageList || loaded.noteId !== noteId || loaded.shareToken !== shareToken || loaded.guestOwned !== guestOwned) {
    return { sources: [], failedCount: 0, loading: true };
  }
  return { sources: loaded.sources, failedCount: loaded.failedCount, loading: loaded.loading };
}
