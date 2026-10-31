"use client";

import { useMemo, useState } from "react";
import type { CouncilResult } from "@/lib/council";
import type { SelfTrust } from "@/lib/outcomes";

interface OutcomeLoopProps {
  result: CouncilResult | null;
  onNotice?: (message: string) => void;
}

type OutcomeChoice = { label: string; value: -1 | 1 | 2; color: string };

const outcomes: OutcomeChoice[] = [
  { label: "Loved it", value: 2, color: "text-lime" },
  { label: "Fine", value: 1, color: "text-cyan" },
  { label: "Regret", value: -1, color: "text-coral" },
];

export function OutcomeLoop({ result, onNotice }: OutcomeLoopProps) {
  const [trust, setTrust] = useState<Record<string, SelfTrust>>({});
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<string | null>(null);

  const leaderboard = useMemo(
    () => Object.values(trust).sort((left, right) => right.accuracy - left.accuracy || right.sampleSize - left.sampleSize),
    [trust],
  );
  const winningOption = result?.options[0];

  async function recordOutcome(outcome: OutcomeChoice) {
    if (!winningOption) {
      return;
    }
    setRecording(true);
    setRecorded(null);
    try {
      const updates = await Promise.all(
        winningOption.scores.map(async (score) => {
          const current = trust[score.selfId];
          const response = await fetch("/api/outcome", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              eraId: score.selfId,
              domain: "decision",
              outcome: outcome.value,
              vote: score.vote,
              alpha: current?.alpha,
              beta: current?.beta,
            }),
          });
          const payload = (await response.json()) as { trust?: SelfTrust; error?: string };
          if (!response.ok || !payload.trust) {
            throw new Error(payload.error ?? "Outcome could not be recorded.");
          }
          return payload.trust;
        }),
      );
      setTrust(() => Object.fromEntries(updates.map((item) => [item.eraId, item])));
      setRecorded(outcome.label);
      onNotice?.(`${outcome.label} recorded. The Self Leaderboard learned from this decision.`);
    } catch (error) {
      onNotice?.(error instanceof Error ? error.message : "Outcome could not be recorded.");
    } finally {
      setRecording(false);
    }
  }

  return (
    <section className="surface overflow-hidden p-5 sm:p-7" aria-labelledby="outcome-loop-heading">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-lime">09 / Outcome loop</p>
          <h2 id="outcome-loop-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
            Let the selves earn trust.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
            One tap after the decision updates a transparent Beta-style hit rate for each seat. No performance numbers are invented before feedback exists.
          </p>
        </div>
        <span className="status-dot">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          Feedback compounds
        </span>
      </div>

      {!winningOption ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-mist">
          Run a Council decision first. Its winning option will appear here for one-tap feedback.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-2xl border border-lime/20 bg-lime/[0.06] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-lime">Last Council verdict</p>
            <p className="mt-3 text-xl font-semibold text-cloud">{winningOption.option}</p>
            <p className="mt-2 text-xs leading-5 text-mist">{result?.verdict}</p>
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-mist">How did it land?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {outcomes.map((outcome) => (
                <button
                  type="button"
                  key={outcome.value}
                  onClick={() => void recordOutcome(outcome)}
                  disabled={recording}
                  className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold transition hover:border-white/25 disabled:cursor-wait disabled:opacity-60 ${outcome.color}`}
                >
                  {recording ? "Recording..." : outcome.label}
                </button>
              ))}
            </div>
            {recorded ? <p className="mt-3 text-xs text-lime">{recorded} saved for {winningOption.scores.length} selves.</p> : null}
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-cloud">Self Leaderboard</p>
              <span className="text-xs text-mist">decision domain</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="mt-5 text-sm leading-6 text-mist">Record the first outcome to establish a baseline for this table.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {leaderboard.map((item) => (
                  <div key={item.eraId} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-cloud">{item.eraId}</span>
                      <span className="text-sm font-semibold text-lime">{item.accuracy}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-lime" style={{ width: `${item.accuracy}%` }} />
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-mist">{item.sampleSize} recorded outcome{item.sampleSize === 1 ? "" : "s"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
