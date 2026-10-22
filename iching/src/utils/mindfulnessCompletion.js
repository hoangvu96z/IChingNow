export function createMindfulnessCountdown({
  onCompleteRef,
  onTimeChange = () => {},
  intervalMs = 1000,
  completionDelayMs = 350,
  scheduleInterval = setInterval,
  cancelInterval = clearInterval,
  scheduleTimeout = setTimeout,
  cancelTimeout = clearTimeout,
}) {
  let intervalId = null;
  let timeoutId = null;
  let remainingSeconds = 10;
  let completed = false;
  let completionScheduled = false;
  let canceled = false;

  function clearTimers() {
    if (intervalId !== null) {
      cancelInterval(intervalId);
      intervalId = null;
    }
    if (timeoutId !== null) {
      cancelTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function complete() {
    if (canceled || completed) return;
    completed = true;
    completionScheduled = false;
    clearTimers();
    onCompleteRef.current();
  }

  return {
    start() {
      if (canceled || completed || intervalId !== null) return;

      intervalId = scheduleInterval(() => {
        if (canceled || completed || completionScheduled) return;

        remainingSeconds -= 1;
        onTimeChange(remainingSeconds);

        if (remainingSeconds <= 0) {
          cancelInterval(intervalId);
          intervalId = null;
          completionScheduled = true;
          timeoutId = scheduleTimeout(() => {
            timeoutId = null;
            complete();
          }, completionDelayMs);
        }
      }, intervalMs);
    },
    skip: complete,
    cancel() {
      if (canceled) return;
      canceled = true;
      clearTimers();
    },
  };
}
