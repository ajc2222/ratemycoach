"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { track, trackOnce } from "@/lib/analytics/client";
import type { EventName, EventProps } from "@/lib/analytics/events";

/**
 * Fires a page-level event once per mount. Mounted by pages that need one
 * (the landing page's `landing_viewed`), rather than globally — a generic
 * pageview event would double-count client-side navigations and is not one of
 * the events in the analytics specification.
 */
export function PageViewTracker({
  event,
  props,
  once = true,
}: {
  event: EventName;
  props?: EventProps;
  once?: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (once) trackOnce(`${event}:${pathname}`, event, { page: pathname, ...props });
    else track(event, { page: pathname, ...props });
    // `props` is a fresh object each render; the pathname is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, pathname, once]);

  return null;
}
