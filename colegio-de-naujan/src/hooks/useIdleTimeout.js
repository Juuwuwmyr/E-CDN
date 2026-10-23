/**
 * useIdleTimeout
 * Tracks user inactivity and calls onIdle() after `timeoutMs`.
 * Calls onWarn() `warnBeforeMs` before the timeout so a warning
 * can be shown. Any user activity resets both timers.
 */
import { useEffect, useRef, useCallback } from 'react';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export default function useIdleTimeout({ timeoutMs, warnBeforeMs, onWarn, onIdle, enabled }) {
  const warnTimer  = useRef(null);
  const idleTimer  = useRef(null);

  const clearTimers = () => {
    clearTimeout(warnTimer.current);
    clearTimeout(idleTimer.current);
  };

  const reset = useCallback(() => {
    if (!enabled) return;
    clearTimers();

    // Warn (timeoutMs - warnBeforeMs) after last activity
    warnTimer.current = setTimeout(() => {
      onWarn();
    }, timeoutMs - warnBeforeMs);

    // Logout at full timeout
    idleTimer.current = setTimeout(() => {
      onIdle();
    }, timeoutMs);
  }, [enabled, timeoutMs, warnBeforeMs, onWarn, onIdle]);

  useEffect(() => {
    if (!enabled) return;

    // Start timers
    reset();

    // Attach activity listeners
    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));

    return () => {
      clearTimers();
      EVENTS.forEach(e => window.removeEventListener(e, reset));
    };
  }, [enabled, reset]);
}