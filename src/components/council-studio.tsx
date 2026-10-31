"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { demoSelves } from "@/lib/demo-data";
import type { CouncilResult } from "@/lib/council";

interface CouncilStudioProps {
  onNotice?: (message: string) => void;
  onResult?: (result: CouncilResult) => void;
}

const initialOptions = ["Tacos in the Arts District", "Ramen near the river", "A small Portuguese spot"];

export function CouncilStudio({ onNotice, onResult }: CouncilStudioProps) {
  const [question, setQuestion] = useState("Where should I take someone for dinner Friday?");
  const [options, setOptions] = useState(initialOptions);
  const [selfIds, setSelfIds] = useState(["campus", "new-city", "now"]);
  const [qlooEnabled, setQlooEnabled] = useState(true);
  const [price, setPrice] = useState("180");
  const [budget, setBudget] = useState("200");
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  }

  function toggleSelf(id: string) {
    setSelfIds((current) => {
      if (current.includes(id)) {
        return current.length === 1 ? current : current.filter((selfId) => selfId !== id);
      }
      return current.length >= 6 ? current : [...current, id];
    });
  }

  async function convene() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/council", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          options,
          selfIds,
          qlooEnabled,
          stakes: {
            price: Number(price) || undefined,
            budget: Number(budget) || undefined,
            reversible: true,
            frequency: "once",
          },
        }),
      });
      const payload = (await response.json()) as CouncilResult | { error?: string };

      if (!response.ok || "error" in payload || !("options" in payload)) {
        throw new Error("error" in payload ? payload.error : "The Council could not convene.");
      }

      setResult(payload);
      onResult?.(payload);
      onNotice?.("The Council has reached a grounded verdict.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The Council could not convene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface overflow-hidden p-5 sm:p-7" aria-labelledby="council-studio-heading">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow text-coral">06 / Council agent</p>
          <h2 id="council-studio-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
            Let every version of you argue from evidence.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
            Qloo scores the affinity. The council explains the disagreement using only the entities in
            each profile.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={qlooEnabled}
          onClick={() => setQlooEnabled((enabled) => !enabled)}
          className={`rounded-full border px-3 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
            qlooEnabled
              ? "border-cyan/30 bg-cyan/10 text-cyan"
              : "border-white/10 text-mist hover:border-white/25 hover:text-cloud"
          }`}
        >
          {qlooEnabled ? "Qloo grounding on" : "LLM-only baseline"}
        </button>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-5">
          <label className="block text-xs uppercase tracking-[0.18em] text-mist" htmlFor="council-question">
            The decision
          </label>
          <textarea
            id="council-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-cloud outline-none transition focus:border-cyan/40 focus:ring-2 focus:ring-cyan/20"
          />

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.18em] text-mist">Options</p>
            <div className="mt-3 space-y-2">
              {options.map((option, index) => (
                <input
                  key={index}
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  aria-label={`Option ${index + 1}`}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-cloud outline-none transition placeholder:text-mist focus:border-cyan/40 focus:ring-2 focus:ring-cyan/20"
                />
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-xs text-mist">
              Price
              <input
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cloud outline-none focus:border-cyan/40"
              />
            </label>
            <label className="text-xs text-mist">
              Budget
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cloud outline-none focus:border-cyan/40"
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.18em] text-mist">Seats at the table</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {demoSelves.map((self) => {
                const selected = selfIds.includes(self.id);
                return (
                  <button
                    type="button"
                    key={self.id}
                    aria-pressed={selected}
                    onClick={() => toggleSelf(self.id)}
                    className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                      selected ? "border-white/25 bg-white/[0.08]" : "border-white/[0.08] bg-white/[0.025]"
                    }`}
                  >
                    <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: self.color }} />
                    <span className="mt-2 block text-[11px] font-semibold text-cloud">{self.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void convene()}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#ff9a86] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            {loading ? "Listening to the room..." : "Convene the Council"}
          </button>
          {error ? (
            <p role="alert" className="mt-3 rounded-xl border border-coral/20 bg-coral/10 px-3 py-2 text-xs text-coral">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-[420px] rounded-2xl border border-white/[0.08] bg-black/10 p-5">
          {!result && !loading ? (
            <div className="grid h-full min-h-[380px] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-coral/30 bg-coral/10 text-2xl text-coral">
                  ?
                </div>
                <p className="mt-5 text-lg font-medium text-cloud">The table is waiting.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-mist">
                  Give the room a real decision and let the profiles disagree.
                </p>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="grid h-full min-h-[380px] place-items-center text-center">
              <div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="mx-auto h-12 w-12 rounded-full border-2 border-white/10 border-t-cyan"
                />
                <p className="mt-5 text-sm text-cloud">Translating the question for each self...</p>
                <p className="mt-2 text-xs text-mist">Scores first. Words second.</p>
              </div>
            </div>
          ) : null}

          {result ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="status-dot">
                  <span className={`h-1.5 w-1.5 rounded-full ${result.qlooMode === "live" ? "bg-lime" : result.qlooMode === "demo" ? "bg-lilac" : "bg-mist"}`} />
                  {result.qlooMode === "live" ? "Live Qloo affinity" : result.qlooMode === "demo" ? "Grounded demo affinity" : "Plain baseline"}
                </span>
                <span className="text-xs text-mist">{result.options.length} options / {selfIds.length} selves</span>
              </div>
              <div className="mt-5 rounded-2xl border border-lime/20 bg-lime/[0.08] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-lime">Mediator verdict</p>
                <p className="mt-2 text-xl font-semibold text-cloud">{result.verdict}</p>
                <p className="mt-2 text-xs leading-5 text-mist">{result.dissent}</p>
              </div>
              <div className="mt-4 space-y-3">
                {result.options.map((option) => (
                  <details key={option.option} className="group rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-cloud">{option.option}</span>
                      <span className="text-lg font-semibold text-cloud">{option.averageScore}</span>
                      <span className="text-xs text-mist">/ 100</span>
                    </summary>
                    <div className="border-t border-white/[0.08] px-4 pb-4 pt-3">
                      <div className="mb-3 flex gap-2 text-[10px] uppercase tracking-[0.14em]">
                        <span className="text-cyan">{option.votes.love} love</span>
                        <span className="text-mist">{option.votes.meh} meh</span>
                        <span className="text-coral">{option.votes.no} no</span>
                      </div>
                      <div className="space-y-3">
                        {option.scores.map((score) => (
                          <div key={score.selfId} className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-cloud">{score.selfLabel}</span>
                              <span className="text-xs text-mist">{score.vote} / {score.score}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <span className="block h-full rounded-full bg-cyan" style={{ width: `${score.score}%` }} />
                            </div>
                            <p className="mt-2 text-xs leading-5 text-mist">{score.statement}</p>
                            {score.evidence.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {score.evidence.map((entity) => (
                                  <span key={entity} className="chip">{entity}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.08] px-4 py-3 text-xs leading-5 text-mist">
                <span className="font-semibold text-cloud">Regret forecast:</span> {result.regretForecast}
                {result.compromise ? <span className="ml-1">Compromise: <span className="text-cloud">{result.compromise}</span>.</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence />
    </section>
  );
}
