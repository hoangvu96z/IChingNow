/**
 * Coordinates a delayed line commit with tosses and resets.
 * A generation token makes pending async work stale as soon as cancel() runs.
 */
export function createLineCommitGate() {
  let generation = 0;
  let pending = false;
  let timer = null;

  function isCurrent(token) {
    return pending && token === generation;
  }

  return {
    begin() {
      if (pending) return null;
      pending = true;
      return generation;
    },

    isCurrent,

    isPending() {
      return pending;
    },

    schedule(token, callback, delayMs) {
      if (!isCurrent(token) || timer !== null) return false;

      timer = setTimeout(() => {
        timer = null;
        if (!isCurrent(token)) return;
        pending = false;
        callback();
      }, delayMs);
      return true;
    },

    cancel() {
      generation += 1;
      pending = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
