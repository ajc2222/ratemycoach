"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Dialog } from "@/components/ui/dialog";
import { track } from "@/lib/analytics/client";
import type { EventName } from "@/lib/analytics/events";
import { copy } from "@/lib/site";
import type { GatedFeature } from "@/lib/taxonomy";

/**
 * Feature-intent gates.
 *
 * These are the most delicate components on the site. When someone reaches for
 * a feature that does not exist yet, we have to do two things at once: record
 * the intent (that is the whole point of the smoke test) and tell the truth.
 *
 * So the panel says the feature is *being prepared*, never that content is
 * waiting behind a signup. There is no "unlock", no blurred fake review text,
 * no "3 reviews hidden" counter. Those patterns would convert better and would
 * poison both the data and the trust of the exact people we need most.
 */

const EVENT_BY_FEATURE: Record<GatedFeature, EventName> = {
  "read-all-reviews": "review_feature_clicked",
  "verified-reviews": "review_feature_clicked",
  "ai-summary": "ai_summary_clicked",
  compare: "compare_clicked",
  "save-coach": "save_coach_clicked",
};

const TITLE_BY_FEATURE: Record<GatedFeature, string> = {
  "read-all-reviews": "Client reviews aren't collected yet",
  "verified-reviews": "Verified reviews aren't collected yet",
  "ai-summary": "Public-source summaries aren't generated yet",
  compare: "Side-by-side comparison isn't built yet",
  "save-coach": "Saving coaches isn't built yet",
};

const EXPLANATION_BY_FEATURE: Record<GatedFeature, string> = {
  "read-all-reviews":
    "There are no reviews to show you — not hidden ones, none at all. We're collecting founding reviews privately from former clients first, so that the day this opens there's something real to read.",
  "verified-reviews":
    "Verification means matching a review to evidence of a real coaching relationship. We haven't built that process yet, so no review has been verified and none are being withheld from you.",
  "ai-summary":
    "This will summarise approved public discussion about a coach, with citations, clearly labelled as a summary rather than a firsthand review. Nothing has been ingested or generated yet.",
  compare:
    "Comparing coaches side by side on price, services, division experience and client-reported experience is planned. It isn't built yet.",
  "save-coach":
    "Saving a shortlist needs accounts, which we haven't built. Tell us who you're researching and we'll come back to you when there's something to save.",
};

interface GateRequest {
  feature: GatedFeature;
  coachId?: string | null;
  coachName?: string | null;
  page?: string | null;
}

interface GateContextValue {
  open: (request: GateRequest) => void;
}

const GateContext = createContext<GateContextValue | null>(null);

export function useFeatureGate(): GateContextValue {
  const context = useContext(GateContext);
  if (!context) {
    throw new Error("useFeatureGate must be used inside <FeatureGateProvider>");
  }
  return context;
}

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<GateRequest | null>(null);

  const open = useCallback((next: GateRequest) => {
    // The click itself is the signal — record it before any dialog renders, so
    // it counts even if the visitor closes the panel immediately.
    track(EVENT_BY_FEATURE[next.feature], {
      feature: next.feature,
      coach_id: next.coachId ?? null,
      page: next.page ?? null,
    });
    setRequest(next);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <GateContext.Provider value={value}>
      {children}
      <Dialog
        open={request !== null}
        onClose={() => setRequest(null)}
        title={request ? TITLE_BY_FEATURE[request.feature] : ""}
        description={
          request ? (
            <>
              <p>{EXPLANATION_BY_FEATURE[request.feature]}</p>
              <p className="text-paper mt-3">{copy.featureGate}</p>
            </>
          ) : null
        }
      >
        {request ? (
          <WaitlistForm
            compact
            formSource={`gate:${request.feature}`}
            triggerFeature={request.feature}
            triggerCoachId={request.coachId ?? null}
            triggerCoachName={request.coachName ?? null}
            triggerPage={request.page ?? null}
          />
        ) : null}
      </Dialog>
    </GateContext.Provider>
  );
}

/** Convenience button that opens the gate for a given feature. */
export function GateButton({
  feature,
  coachId,
  coachName,
  page,
  className,
  children,
}: GateRequest & { className?: string; children: ReactNode }) {
  const { open } = useFeatureGate();
  return (
    <button
      type="button"
      className={className}
      onClick={() => open({ feature, coachId, coachName, page })}
    >
      {children}
    </button>
  );
}
