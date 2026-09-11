"use client";

import { useState } from "react";
import { QuickActionsRow } from "./quick-actions-row";
import { UntrackedBanner } from "./untracked-banner";
import { GapReviewSheet, type Gap } from "./gap-review-sheet";

/** Wires the "Review Gaps" quick action and the untracked-time banner to one shared sheet. */
export function GapReviewController({
  gaps,
  totalSeconds,
  timezone,
  timeFormat,
}: {
  gaps: Gap[];
  totalSeconds: number;
  timezone: string;
  timeFormat: string;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <>
      <QuickActionsRow onReviewGaps={() => setReviewOpen(true)} />
      <UntrackedBanner
        totalSeconds={totalSeconds}
        gapCount={gaps.length}
        onReview={() => setReviewOpen(true)}
      />
      <GapReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        gaps={gaps}
        timezone={timezone}
        timeFormat={timeFormat}
      />
    </>
  );
}
