"use client";

import { COOKIES } from "@/lib/request-context";

import type { EventName, EventProps } from "./events";

/**
 * Browser-side event tracker.
 *
 * Design constraints:
 *  - Never block navigation or a form submit. Events are queued and flushed
 *    with `sendBeacon`, which survives the page being closed.
 *  - Never lose the "last" event on a page: flush on `visibilitychange`.
 *  - Never double-count a once-per-view event (page views, search starts).
 *  - Never send anything the server would reject; the property allow-list is
 *    enforced on the server, this is just the first line.
 */

interface QueuedEvent {
  name: EventName;
  props: EventProps;
  page: string;
  ts: string;
}

const QUEUE: QueuedEvent[] = [];
const FIRED_ONCE = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAttached = false;

const FLUSH_DELAY_MS = 2500;
const MAX_BATCH = 12;
const ENDPOINT = "/api/events";

function debugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Session id: per tab, per visit. Distinct from the visitor id (a cookie) so we
 * can tell "one person searching five times" from "five people searching once".
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "pcr_sid";
  try {
    const existing = window.sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    // Private mode / storage disabled: analytics degrade, the site does not.
    return "";
  }
}

export function getVisitorId(): string | null {
  return readCookie(COOKIES.visitor);
}

export function getVariant(): string | null {
  return readCookie(COOKIES.variant);
}

function currentPage(): string {
  if (typeof window === "undefined") return "";
  // Path only — query strings can contain a searched coach name, which belongs
  // in the private search table rather than the analytics stream.
  return window.location.pathname;
}

function send(events: QueuedEvent[]): void {
  if (events.length === 0) return;
  const body = JSON.stringify({
    session_id: getSessionId(),
    events: events.map((e) => ({ name: e.name, props: e.props, page: e.page, ts: e.ts })),
  });

  if (debugEnabled()) {
    console.info(
      "[analytics]",
      events.map((e) => `${e.name} ${JSON.stringify(e.props)}`),
    );
  }

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* analytics must never throw into the UI */
  }
}

export function flushEvents(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const batch = QUEUE.splice(0, QUEUE.length);
  send(batch);
}

function attachListeners(): void {
  if (listenersAttached || typeof document === "undefined") return;
  listenersAttached = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEvents();
  });
  window.addEventListener("pagehide", flushEvents);
}

export function track(name: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined") return;
  attachListeners();
  QUEUE.push({ name, props, page: currentPage(), ts: new Date().toISOString() });
  if (QUEUE.length >= MAX_BATCH) {
    flushEvents();
    return;
  }
  if (!flushTimer) flushTimer = setTimeout(flushEvents, FLUSH_DELAY_MS);
}

/**
 * Fires at most once per key for the lifetime of the page. Used for page views
 * and "started" events, where a second fire would corrupt a conversion rate.
 */
export function trackOnce(key: string, name: EventName, props: EventProps = {}): void {
  if (FIRED_ONCE.has(key)) return;
  FIRED_ONCE.add(key);
  track(name, props);
}

/** Test seam — resets the once-only guard between assertions. */
export function __resetTrackerForTests(): void {
  QUEUE.length = 0;
  FIRED_ONCE.clear();
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
}
