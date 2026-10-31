"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { buildEraProfile, type EraSignal, type SignalSentiment } from "@/lib/profile";
import {
  domainTabs,
  eraGridPools,
  eraGridYears,
  type EraGridCard,
} from "@/lib/demo-data";

type GridDomain = (typeof domainTabs)[number];
type CardAction = "love" | "avoid";

interface EraPoolResponse {
  source: "qloo" | "demo";
  year: number;
  cards: EraGridCard[];
}

interface EraGridProps {
  onMeetSelf?: (year: number, completeness: number) => void;
  onNotice?: (message: string) => void;
}

function actionSentiment(action: CardAction): SignalSentiment {
  return action === "love" ? 2 : -2;
}

export function EraGrid({ onMeetSelf, onNotice }: EraGridProps) {
  const [year, setYear] = useState(2019);
  const [domain, setDomain] = useState<GridDomain>("All");
  const [cards, setCards] = useState<EraGridCard[]>(eraGridPools[2019] ?? []);
  const [source, setSource] = useState<"qloo" | "demo">("demo");
  const [actions, setActions] = useState<Record<string, CardAction>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadPool() {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({ year: String(year), domain });
        const response = await fetch(`/api/era-pool?${query}`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Era pool could not be loaded.");
        }

        const payload = (await response.json()) as EraPoolResponse;
        if (active) {
          setCards(payload.cards);
          setSource(payload.source);
          setActions({});
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }

        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Era pool could not be loaded.");
          setCards(
            (eraGridPools[year] ?? eraGridPools[eraGridYears[0]] ?? []).filter(
              (card) => domain === "All" || card.domain === domain,
            ),
          );
          setSource("demo");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPool();
    return () => {
      active = false;
      controller.abort();
    };
  }, [domain, year]);

  const signals = useMemo<EraSignal[]>(
    () =>
      cards.flatMap((card) => {
        const action = actions[card.id];
        if (!action) {
          return [];
        }

        return [
          {
            qlooEntityId: card.id,
            name: card.name,
            domain: card.domain,
            qlooType: card.type,
            sentiment: actionSentiment(action),
            provenance: "tap" as const,
            mentions: 1,
            recency: 1,
            confidence: source === "qloo" ? 0.95 : 0.8,
          },
        ];
      }),
    [actions, cards, source],
  );
  const profile = useMemo(
    () =>
      buildEraProfile({
        eraId: `era-${year}`,
        label: `${year}-me`,
        years: String(year),
        signals,
      }),
    [signals, year],
  );
  const signalPercent = Math.min(100, Math.round((signals.length / 8) * 100));

  function setCardAction(card: EraGridCard, action: CardAction) {
    setActions((current) => {
      if (current[card.id] !== action) {
        return { ...current, [card.id]: action };
      }

      const next = { ...current };
      delete next[card.id];
      return next;
    });
    onNotice?.(
      action === "love"
        ? `${card.name} added to ${year}-me.`
        : `${card.name} marked as a miss for ${year}-me.`,
    );
  }

  return (
    <section className="surface overflow-hidden p-5 sm:p-7" aria-labelledby="era-grid-heading">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow text-lime">05 / Era Grid</p>
          <h2 id="era-grid-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
            Tap what was you.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mist">
            Start with a year. Qloo supplies the cultural neighborhood; your taps turn it into a labeled
            signal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="status-dot">
            <span className={`h-1.5 w-1.5 rounded-full ${source === "qloo" ? "bg-lime" : "bg-lilac"}`} />
            {source === "qloo" ? "Live Qloo pool" : "Seeded demo pool"}
          </span>
          <span className="text-sm font-semibold text-cloud">{signalPercent}% signal</span>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-black/10 p-4 sm:p-5">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist">
            Year
          </span>
          {eraGridYears.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={year === option}
              onClick={() => setYear(option)}
              className={`rounded-full border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                year === option
                  ? "border-cloud/30 bg-cloud text-ink"
                  : "border-white/10 text-mist hover:border-white/25 hover:text-cloud"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Era Grid domains">
          {domainTabs.map((option) => (
            <button
              type="button"
              role="tab"
              aria-selected={domain === option}
              key={option}
              onClick={() => setDomain(option)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                domain === option ? "bg-white/[0.1] text-cloud" : "text-mist hover:bg-white/[0.05] hover:text-cloud"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-coral/20 bg-coral/10 px-4 py-3 text-xs text-coral" role="alert">
          {error} Showing the local demo pool instead.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const action = actions[card.id];
            return (
              <motion.article
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: index * 0.025 }}
                key={card.id}
                className={`group rounded-2xl border p-4 transition ${
                  action === "love"
                    ? "border-cyan/40 bg-cyan/[0.08]"
                    : action === "avoid"
                      ? "border-coral/30 bg-coral/[0.06]"
                      : "border-white/[0.08] bg-white/[0.025] hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-mist">
                    {card.domain}
                  </span>
                  <span className="text-[10px] text-mist">{Math.round(card.popularity * 100)}%</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-cloud">{card.name}</h3>
                <p className="mt-2 min-h-10 text-xs leading-5 text-mist">{card.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-mist">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    aria-label={`Love ${card.name}`}
                    aria-pressed={action === "love"}
                    onClick={() => setCardAction(card, "love")}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                      action === "love"
                        ? "border-cyan/40 bg-cyan/20 text-cyan"
                        : "border-white/10 text-mist hover:border-cyan/30 hover:text-cyan"
                    }`}
                  >
                    That was me
                  </button>
                  <button
                    type="button"
                    aria-label={`Dislike ${card.name}`}
                    aria-pressed={action === "avoid"}
                    onClick={() => setCardAction(card, "avoid")}
                    className={`rounded-lg border px-3 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                      action === "avoid"
                        ? "border-coral/40 bg-coral/20 text-coral"
                        : "border-white/10 text-mist hover:border-coral/30 hover:text-coral"
                    }`}
                  >
                    No
                  </button>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center">
        <div className="text-xs text-mist">
          <span className="font-semibold text-cloud">{signals.length}</span> confirmed signals
          {profile.conflicts.length > 0 ? (
            <span className="ml-3 text-coral">{profile.conflicts.length} conflict to review</span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={signals.length < 4 || loading}
          onClick={() => onMeetSelf?.(year, profile.completeness)}
          className="rounded-full bg-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-[#d6f692] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
        >
          Meet {year}-me
        </button>
      </div>
    </section>
  );
}
