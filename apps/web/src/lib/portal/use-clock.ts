"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 1000);

  return () => window.clearInterval(timer);
}

function getSnapshot() {
  return Math.floor(Date.now() / 1000);
}

function getServerSnapshot(): number | null {
  return null;
}

export function useClock(): Date | null {
  const seconds = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return seconds === null ? null : new Date(seconds * 1000);
}

function subscribeMinute(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000);

  return () => window.clearInterval(timer);
}

function getMinuteSnapshot() {
  return Math.floor(Date.now() / 60_000);
}

export function useMinuteClock(): Date | null {
  const minutes = useSyncExternalStore(
    subscribeMinute,
    getMinuteSnapshot,
    getServerSnapshot,
  );

  return minutes === null ? null : new Date(minutes * 60_000);
}
