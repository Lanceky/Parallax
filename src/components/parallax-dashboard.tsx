"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  demoSelves,
  domainTabs,
  timelineYears,
  type DemoSelf,
} from "@/lib/demo-data";
import { EraGrid } from "@/components/era-grid";
import { CaptureHub } from "@/components/capture-hub";
import { CouncilStudio } from "@/components/council-studio";
import { OutcomeLoop } from "@/components/outcome-loop";
import { TimelineMap } from "@/components/timeline-map";
import type { CouncilResult } from "@/lib/council";

function SelfOrb({
  self,
  active,
  onSelect,
}: {
  self: DemoSelf;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Select ${self.label}, ${self.years}`}
      onClick={onSelect}
      className={`group relative flex min-w-[148px] flex-col items-center rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
        active
          ? "border-white/30 bg-white/[0.09] shadow-glow"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <motion.span
        layout
        animate={{
          scale: active ? 1.08 : 1,
          boxShadow: active
            ? `0 0 0 8px ${self.color}18, 0 0 36px ${self.color}55`
            : `0 0 0 4px ${self.color}12`,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="mb-3 block h-11 w-11 rounded-full border border-white/40"
        style={{ backgroundColor: self.color }}
      />
      <span className="text-sm font-semibold text-cloud">{self.label}</span>
      <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-mist">{self.years}</span>
      <span className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full"
          style={{ width: `${self.completeness}%`, backgroundColor: self.color }}
        />
      </span>
    </button>
  );
}

export function ParallaxDashboard() {
  const [selectedSelfId, setSelectedSelfId] = useState("now");
  const [selectedDomain, setSelectedDomain] = useState<(typeof domainTabs)[number]>("All");
  const [notice, setNotice] = useState<string | null>(null);
  const [councilResult, setCouncilResult] = useState<CouncilResult | null>(null);

  const selectedSelf = demoSelves.find((self) => self.id === selectedSelfId) ?? demoSelves[0];
  const visibleEntities = useMemo(
    () =>
      selectedSelf.entities.filter(
        (entity) => selectedDomain === "All" || entity.domain === selectedDomain,
      ),
    [selectedDomain, selectedSelf],
  );

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-cloud">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(98,217,212,.12),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(183,163,255,.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1480px] px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[0.08] text-sm font-bold text-cyan">
              P
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-cloud">Parallax</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-mist">Taste has a history</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-xs text-cyan sm:inline-flex">
              Demo persona: Chuka
            </span>
            <Link
              href="/connect"
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-mist transition hover:border-white/30 hover:text-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              Connect
            </Link>
          </div>
        </header>

        <section className="grid gap-8 pb-12 pt-12 lg:grid-cols-[1.25fr_.75fr] lg:items-end lg:pt-20">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan">
              Your personal taste council
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-cloud sm:text-7xl">
              You are not one taste profile.
              <span className="block text-mist">You are a timeline.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-mist sm:text-lg">
              Parallax turns the eras of you into a council. Qloo grounds every vote in the
              cultural signals you actually love, not generic roleplay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => showNotice("Choose a year below to start tuning your first self.")}
                className="rounded-full bg-cloud px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                Meet a past self
              </button>
              <button
                type="button"
                onClick={() => showNotice("The judge path uses seeded data - no account required.")}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cloud transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                How it works
              </button>
            </div>
          </div>

          <div className="surface relative overflow-hidden p-6 sm:p-7">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lilac/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-lilac">Qloo grounding</span>
                <span className="status-dot">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                  Ready
                </span>
              </div>
              <p className="mt-7 max-w-sm text-2xl font-medium leading-tight text-cloud">
                The graph supplies the cultural memory. The council makes the call.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  ["250M+", "entities"],
                  ["7", "Qloo roles"],
                  ["0", "logins"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-white/[0.08] bg-black/10 p-3">
                    <p className="text-lg font-semibold text-cloud">{value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-mist">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="surface overflow-hidden p-5 sm:p-7" aria-labelledby="timeline-heading">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow text-coral">01 / Timeline Studio</p>
              <h2 id="timeline-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
                Pick the version of you at the table.
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-mist">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-coral" /> From your data
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-lilac" /> Inferred by Qloo
              </span>
            </div>
          </div>

          <div className="timeline-grid relative mt-8 overflow-x-auto rounded-2xl border border-white/[0.07] px-4 pb-5 pt-8 sm:px-8">
            <div className="absolute left-12 right-12 top-[106px] h-px bg-gradient-to-r from-coral/60 via-cyan/50 to-lilac/60" />
            <div className="relative flex min-w-[680px] justify-between gap-6">
              {timelineYears.map((marker, index) => {
                const self = demoSelves.find((item) => item.id === marker.selfId) ?? demoSelves[0];
                const active = selectedSelfId === marker.selfId;
                return (
                  <button
                    type="button"
                    key={`${marker.year}-${marker.label}`}
                    aria-label={`Select ${self.label} at ${marker.year}`}
                    aria-pressed={active}
                    onClick={() => setSelectedSelfId(marker.selfId)}
                    className="group relative z-10 flex min-w-[112px] flex-1 flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                  >
                    <span className="mb-4 text-xs font-semibold text-mist transition group-hover:text-cloud">
                      {marker.year}
                    </span>
                    <motion.span
                      animate={{ scale: active ? 1.2 : 1 }}
                      className="grid h-10 w-10 place-items-center rounded-full border-4 border-panel"
                      style={{ backgroundColor: self.color, boxShadow: `0 0 24px ${self.color}50` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                    </motion.span>
                    <span className="mt-4 text-center text-xs text-mist transition group-hover:text-cloud">
                      {marker.label}
                    </span>
                    {index < timelineYears.length - 1 ? (
                      <span className="mt-2 text-[10px] uppercase tracking-[0.15em] text-white/25">
                        drift
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {demoSelves.map((self) => (
              <SelfOrb
                key={self.id}
                self={self}
                active={selectedSelfId === self.id}
                onSelect={() => setSelectedSelfId(self.id)}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-6 lg:grid-cols-[1.1fr_.9fr]">
          <CaptureHub onNotice={showNotice} />

          <div className="surface p-5 sm:p-7" aria-labelledby="self-heading">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-lilac">03 / Meet a self</p>
                <h2 id="self-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
                  {selectedSelf.label}
                </h2>
              </div>
              <span className="rounded-full border border-lilac/20 bg-lilac/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-lilac">
                Approximation
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-mist">{selectedSelf.description}</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-mist">Completeness</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${selectedSelf.completeness}%`, backgroundColor: selectedSelf.color }}
                />
              </span>
              <span className="text-xs font-semibold text-cloud">{selectedSelf.completeness}%</span>
            </div>
            <p className="mt-5 text-xs text-mist">
              Voice: <span className="text-cloud">{selectedSelf.voice}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Taste entities">
              {selectedSelf.entities.map((entity) => (
                <span
                  key={entity.name}
                  role="listitem"
                  className="chip"
                  title={`${entity.provenance} signal, ${Math.round(entity.confidence * 100)}% confidence`}
                >
                  <span className={entity.provenance === "inferred" ? "h-1.5 w-1.5 rounded-full bg-lilac" : "h-1.5 w-1.5 rounded-full bg-coral"} />
                  {entity.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-6">
          <EraGrid
            onNotice={showNotice}
            onMeetSelf={(year, completeness) =>
              showNotice(`${year}-me is ready at ${completeness}% completeness. Add them to the Council next.`)
            }
          />
        </section>

        <section className="py-6" aria-labelledby="council-heading">
          <CouncilStudio
            onNotice={showNotice}
            onResult={setCouncilResult}
          />
        </section>

        <section className="py-6">
          <TimelineMap
            onNotice={showNotice}
            onSummon={(selfId) => setSelectedSelfId(selfId)}
          />
        </section>

        <section className="py-6">
          <OutcomeLoop result={councilResult} onNotice={showNotice} />
        </section>

        <section className="py-12" aria-labelledby="signals-heading">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow text-cyan">Signals in view</p>
              <h2 id="signals-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
                What {selectedSelf.label.toLowerCase()} knows so far.
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Entity domains">
              {domainTabs.map((domain) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedDomain === domain}
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                    selectedDomain === domain
                      ? "border-cloud/30 bg-cloud text-ink"
                      : "border-white/10 text-mist hover:border-white/25 hover:text-cloud"
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {visibleEntities.map((entity) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  key={entity.name}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-cloud">{entity.name}</span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entity.provenance === "inferred" ? "#b7a3ff" : selectedSelf.color }} />
                  </div>
                  <p className="mt-2 text-xs text-mist">{entity.domain}</p>
                  <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-mist">
                    <span>{entity.provenance}</span>
                    <span>{Math.round(entity.confidence * 100)}% signal</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-white/[0.08] py-6 text-xs text-mist sm:flex-row sm:items-center">
          <p>Parallax is an approximation built from your data. You decide what happens next.</p>
          <p className="text-white/35">Qloo LLM Hackathon / 2026</p>
        </footer>
      </div>

      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-panel px-4 py-3 text-sm text-cloud shadow-glow"
          >
            {notice}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
