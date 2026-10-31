"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import exifr from "exifr";
import { parseImportFile, type ImportSummary } from "@/lib/importers";

interface CaptureHubProps {
  onNotice?: (message: string) => void;
}

interface ScreenshotCapture {
  id: string;
  name: string;
  previewUrl: string;
  year: string;
  chips: string[];
}

interface PhotoScan {
  id: string;
  name: string;
  year: number | null;
  latitude: number | null;
  longitude: number | null;
  included: boolean;
}

function formatYearRange(years: Record<string, number>): string {
  const parsed = Object.keys(years).map(Number).filter(Number.isInteger).sort((a, b) => a - b);
  if (parsed.length === 0) {
    return "No dated signals yet";
  }
  return parsed.length === 1 ? String(parsed[0]) : `${parsed[0]} - ${parsed[parsed.length - 1]}`;
}

export function CaptureHub({ onNotice }: CaptureHubProps) {
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotCapture[]>([]);
  const [screenshotYear, setScreenshotYear] = useState("2019");
  const [screenshotChips, setScreenshotChips] = useState("");
  const [photos, setPhotos] = useState<PhotoScan[]>([]);
  const [scanning, setScanning] = useState(false);
  const screenshotsRef = useRef(screenshots);
  screenshotsRef.current = screenshots;

  const histogram = useMemo(() => {
    if (!importSummary) {
      return [];
    }

    const values = Object.entries(importSummary.years);
    const max = Math.max(...values.map(([, count]) => count), 1);
    return values.map(([year, count]) => ({ year, count, percent: Math.round((count / max) * 100) }));
  }, [importSummary]);

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    setImporting(true);
    setImportError(null);
    try {
      const summary = await parseImportFile(file);
      setImportSummary(summary);
      onNotice?.(`${summary.source === "spotify" ? "Spotify" : "WhatsApp"} history sliced into ${summary.activities.length} signals.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import could not be read.");
    } finally {
      setImporting(false);
    }
  }

  function handleScreenshots(files: FileList | null) {
    if (!files) {
      return;
    }

    const next = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      year: screenshotYear,
      chips: screenshotChips.split(",").map((chip) => chip.trim()).filter(Boolean),
    }));
    setScreenshots((current) => [...current, ...next]);
    onNotice?.(`${next.length} screenshot${next.length === 1 ? "" : "s"} ready for review.`);
  }

  async function handlePhotos(files: FileList | null) {
    if (!files) {
      return;
    }

    setScanning(true);
    const next: PhotoScan[] = [];
    for (const file of Array.from(files).slice(0, 40)) {
      let metadata: { DateTimeOriginal?: Date; latitude?: number; longitude?: number } = {};
      try {
        metadata = (await exifr.parse(file, {
          pick: ["DateTimeOriginal", "latitude", "longitude"],
        })) ?? {};
      } catch {
        metadata = {};
      }

      next.push({
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        year: metadata.DateTimeOriginal instanceof Date ? metadata.DateTimeOriginal.getFullYear() : null,
        latitude: typeof metadata.latitude === "number" ? Number(metadata.latitude.toFixed(3)) : null,
        longitude: typeof metadata.longitude === "number" ? Number(metadata.longitude.toFixed(3)) : null,
        included: true,
      });
    }
    setPhotos((current) => [...current, ...next]);
    setScanning(false);
    onNotice?.("Photos stayed on this device. Review the extracted year and coarse location signals.");
  }

  useEffect(() => {
    return () => {
      for (const screenshot of screenshotsRef.current) {
        URL.revokeObjectURL(screenshot.previewUrl);
      }
    };
  }, []);

  return (
    <section className="surface overflow-hidden p-5 sm:p-7" aria-labelledby="capture-hub-heading">
      <div>
        <p className="eyebrow text-cyan">07 / Capture hub</p>
        <h2 id="capture-hub-heading" className="mt-2 text-2xl font-semibold tracking-tight text-cloud">
          One drop becomes many eras.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
          Raw files are read transiently. Parallax keeps only the dated signals you approve.
        </p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-cloud">Dated export slicer</p>
              <p className="mt-1 text-xs leading-5 text-mist">Spotify Extended History or WhatsApp TXT</p>
            </div>
            <label className="cursor-pointer rounded-full border border-cyan/25 bg-cyan/10 px-3 py-2 text-xs text-cyan transition hover:bg-cyan/20">
              {importing ? "Reading..." : "Choose export"}
              <input
                type="file"
                accept=".json,.txt,.zip"
                className="sr-only"
                disabled={importing}
                onChange={(event) => void handleImport(event.target.files?.[0])}
              />
            </label>
          </div>
          {importError ? <p className="mt-3 text-xs text-coral">{importError}</p> : null}
          {importSummary ? (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cloud">{importSummary.source} / {importSummary.activities.length} signals</span>
                <span className="text-mist">{formatYearRange(importSummary.years)}</span>
              </div>
              <div className="mt-4 flex h-24 items-end gap-1 border-b border-white/10">
                {histogram.map((item) => (
                  <div key={item.year} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-cyan/70" style={{ height: `${Math.max(8, item.percent)}%` }} title={`${item.year}: ${item.count} signals`} />
                    <span className="text-[9px] text-mist">{item.year}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {importSummary.entities.slice(0, 8).map((entity) => (
                  <span key={`${entity.typeHint}-${entity.surface}`} className="chip">
                    {entity.surface} <span className="text-mist">x{entity.mentions}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-xs text-mist">
              Drop one dated export to create a histogram and suggested era boundaries.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-5">
          <p className="text-sm font-semibold text-cloud">Screenshot cards</p>
          <p className="mt-1 text-xs leading-5 text-mist">Wrapped, Replay, playlist, shelf - confirm the chips yourself.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <input
              value={screenshotYear}
              onChange={(event) => setScreenshotYear(event.target.value)}
              aria-label="Screenshot year"
              inputMode="numeric"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cloud outline-none focus:border-cyan/40"
              placeholder="Year"
            />
            <input
              value={screenshotChips}
              onChange={(event) => setScreenshotChips(event.target.value)}
              aria-label="Screenshot chips"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-cloud outline-none focus:border-cyan/40"
              placeholder="artist, film, place"
            />
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 px-4 py-6 text-xs text-mist transition hover:border-white/30 hover:text-cloud">
            Add screenshots
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => handleScreenshots(event.target.files)} />
          </label>
          {screenshots.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {screenshots.map((screenshot) => (
                <div key={screenshot.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshot.previewUrl} alt={screenshot.name} className="h-20 w-full object-cover opacity-80" />
                  <div className="p-2 text-[10px] text-mist">{screenshot.year} / {screenshot.chips.slice(0, 2).join(", ") || "review chips"}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-5 lg:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cloud">Camera roll by year</p>
              <p className="mt-1 text-xs leading-5 text-mist">EXIF is read in-browser. Photos never upload; only approved labels can leave the device.</p>
            </div>
            <label className="cursor-pointer rounded-full border border-lime/25 bg-lime/10 px-3 py-2 text-xs text-lime transition hover:bg-lime/20">
              {scanning ? "Scanning..." : "Choose photos"}
              <input type="file" accept="image/*" multiple className="sr-only" disabled={scanning} onChange={(event) => void handlePhotos(event.target.files)} />
            </label>
          </div>
          <div className="mt-4 rounded-xl border border-lime/15 bg-lime/[0.05] px-4 py-3 text-xs leading-5 text-mist">
            Privacy boundary: only year and coarse GPS metadata are extracted in this demo. Review every result before adding it to a self.
          </div>
          {photos.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {photos.map((photo) => (
                <label key={photo.id} className={`rounded-xl border p-3 text-xs ${photo.included ? "border-lime/25 bg-lime/[0.05]" : "border-white/10 opacity-50"}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-cloud">{photo.name}</span>
                    <input type="checkbox" checked={photo.included} onChange={() => setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, included: !item.included } : item))} />
                  </span>
                  <span className="mt-2 block text-mist">{photo.year ?? "year not found"}</span>
                  <span className="mt-1 block text-mist">{photo.latitude !== null ? `${photo.latitude}, ${photo.longitude}` : "no GPS"}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
