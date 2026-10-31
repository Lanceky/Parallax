"use client";

import { useMemo, useState } from "react";
import { compareProfiles, getDemoSelf, type DriftSummary, type TranslatedEntity } from "@/lib/timeline";
import { demoSelves } from "@/lib/demo-data";

interface TimelineMapProps {
  onNotice?: (message: string) => void;
  onSummon?: (selfId: string) => void;
}

export function TimelineMap({ onNotice, onSummon }: TimelineMapProps) {
  const [fromId, setFromId] = useState("campus");
  const [toId, setToId] = useState("now");
  const [translation, setTranslation] = useState<TranslatedEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = getDemoSelf(fromId);
  const to = getDemoSelf(toId);
  const drift = useMemo<DriftSummary>(() => compareProfiles(from, to), [from, to]);
  const driftGroups: Array<{ label: string; items: string[]; color: string }> = [
    { label: "Kept", items: drift.kept, color: "text-cyan" },
    { label: "Dropped", items: drift.dropped, color: "text-coral" },
    { label: "Acquired", items: drift.acquired, color: "text-lime" },
  ];

  async function translate() {
    const source = from.entities[0];
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entityName: source.name,
          entityType: "urn:entity:artist",
          targetYear: Number(to.years.slice(0, 4)) || new Date().getFullYear(),
          direction: "to_present",
        }),
      });
      const payload = (await response.json()) as { translation?: TranslatedEntity; error?: string };
      if (!response.ok || !payload.translation) {
        throw new Error(payload.error ?? "The timeline translation failed.");
      }
      setTranslation(payload.translation);
      onNotice?.(`${source.name} translated across the timeline.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The timeline translation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface overflow-hidden p-5 sm:p-7" aria-labelledby="timeline-map-heading">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-lilac">08 / Timeline map</p>
          <h2 id="timeline-map-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
            Watch taste travel, not just change.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
            Drift shows what survived between eras. Translation lets an older self judge a newer signal through its own horizon.
          </p>
        </div>
        <span className="status-dot">
          <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
          Approximation / Qloo bridge
        </span>
      </div>

      <div className="mt-7 rounded-2xl border border-white/[0.08] bg-black/10 p-4 sm:p-5">
        <div className="relative flex min-w-[560px] items-start justify-between gap-4 overflow-x-auto pb-2">
          <div className="absolute left-8 right-8 top-8 h-px bg-gradient-to-r from-coral/60 via-cyan/60 to-lilac/60" />
          {demoSelves.map((self) => {
            const selected = fromId === self.id || toId === self.id;
            return (
              <button
                type="button"
                key={self.id}
                onClick={() => setFromId(self.id)}
                className={`relative z-10 min-w-[142px] rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                  selected ? "border-white/25 bg-white/[0.08]" : "border-white/[0.08] bg-white/[0.025]"
                }`}
              >
                <span className="block h-4 w-4 rounded-full border-2 border-panel" style={{ backgroundColor: self.color }} />
                <span className="mt-3 block text-xs font-semibold text-cloud">{self.label}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-mist">{self.years}</span>
                <span className="mt-3 block text-[10px] text-mist">{selected ? "comparison seat" : "summon to compare"}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-mist">
          <span className="rounded-full border border-coral/20 bg-coral/10 px-2.5 py-1 text-coral">Lived trunk</span>
          <span className="rounded-full border border-lilac/20 bg-lilac/10 px-2.5 py-1 text-lilac">Speculative bridge</span>
          {demoSelves.map((self) => (
            <button
              type="button"
              key={`summon-${self.id}`}
              onClick={() => {
                onSummon?.(self.id);
                onNotice?.(`${self.label} is ready for the Council.`);
              }}
              className="rounded-full border border-white/10 px-2.5 py-1 transition hover:border-white/25 hover:text-cloud"
            >
              Summon {self.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-mist">Compare eras</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <label className="text-xs text-mist">
              From
              <select
                value={fromId}
                onChange={(event) => setFromId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-cloud outline-none focus:border-cyan/40"
              >
                {demoSelves.map((self) => <option key={self.id} value={self.id}>{self.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-mist">
              To
              <select
                value={toId}
                onChange={(event) => setToId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-cloud outline-none focus:border-cyan/40"
              >
                {demoSelves.map((self) => <option key={self.id} value={self.id}>{self.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-5 rounded-xl border border-lilac/20 bg-lilac/[0.07] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-lilac">Profile similarity</p>
            <p className="mt-2 text-3xl font-semibold text-cloud">{drift.similarity}%</p>
            <p className="mt-1 text-xs leading-5 text-mist">{drift.from} to {drift.to}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {driftGroups.map(({ label, items, color }) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                <p className={`text-[10px] uppercase tracking-[0.16em] ${color}`}>{label}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {items.slice(0, 4).map((item) => <span className="chip" key={item}>{item}</span>)}
                  {items.length === 0 ? <span className="text-xs text-mist">None yet</span> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-cyan">Translate a signal</p>
                <p className="mt-1 text-sm text-cloud">{from.entities[0].name} → {to.label}</p>
              </div>
              <button
                type="button"
                onClick={() => void translate()}
                disabled={loading}
                className="rounded-full bg-cyan px-3 py-2 text-xs font-semibold text-ink transition hover:bg-[#8ae9e5] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                {loading ? "Bridging..." : "Translate"}
              </button>
            </div>
            {translation ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="chip">{translation.source}</span>
                <span className="text-mist">→</span>
                <span className="chip">{translation.target}</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-mist">{Math.round(translation.confidence * 100)}% confidence</span>
                <p className="basis-full text-xs leading-5 text-mist">{translation.reason}</p>
              </div>
            ) : null}
            {error ? <p role="alert" className="mt-3 text-xs text-coral">{error}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
