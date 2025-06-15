
import { useState, useRef, useCallback } from "react";

// For timer functionality for recordings (max 2min)
export function useRecordingTimer(onLimit: () => void) {
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setTime(0);
    intervalRef.current = setInterval(() => {
      setTime(prev => {
        if (prev >= 120) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onLimit();
          return 120;
        }
        return prev + 1;
      });
    }, 1000);
  }, [onLimit]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const reset = useCallback(() => setTime(0), []);

  return { time, start, stop, reset };
}
