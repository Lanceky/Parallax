"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Scope = "private" | "trusted" | "public";

interface TokenResponse {
  token: string;
  endpoint: string;
  record: {
    id: string;
    scope: Scope;
    allowedTools: string[];
    label: string;
    createdAt: string;
  };
}

export function ConnectPanel() {
  const [scope, setScope] = useState<Scope>("trusted");
  const [label, setLabel] = useState("My Parallax connection");
  const [created, setCreated] = useState<TokenResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);

  const endpoint = useMemo(() => {
    if (typeof window === "undefined") {
      return "https://parallaxx.vercel.app/mcp";
    }
    return `${window.location.origin}/mcp`;
  }, []);

  async function createToken() {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/mcp/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope, label }),
      });
      const payload = (await response.json()) as TokenResponse | { error?: string };
      if (!response.ok || !("token" in payload)) {
        throw new Error("error" in payload ? payload.error : "Token creation failed.");
      }
      setCreated(payload);
      setActivity((current) => [`Created ${payload.record.scope} token`, ...current].slice(0, 5));
      setStatus("Token created. Copy it now; Parallax will not show it again after this page is closed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Token creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function smokeTest() {
    if (!created) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/mcp", {
        method: "POST",
        headers: {
          authorization: `Bearer ${created.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });
      const payload = await response.json() as { result?: { tools?: unknown[] }; error?: { message?: string } };
      if (!response.ok || !payload.result?.tools) {
        throw new Error(payload.error?.message ?? "MCP smoke test failed.");
      }
      setActivity((current) => ["tools/list smoke test passed", ...current].slice(0, 5));
      setStatus(`MCP is reachable. ${payload.result.tools.length} tools are available.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "MCP smoke test failed.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!created) {
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/mcp/token", {
        method: "DELETE",
        headers: { authorization: `Bearer ${created.token}` },
      });
      setActivity((current) => ["Revoked current token", ...current].slice(0, 5));
      setCreated(null);
      setStatus("Token revoked.");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, labelToCopy: string) {
    await navigator.clipboard.writeText(value);
    setCopied(labelToCopy);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const config = created
    ? JSON.stringify(
        {
          mcpServers: {
            parallax: {
              url: endpoint,
              headers: { Authorization: `Bearer ${created.token}` },
            },
          },
        },
        null,
        2,
      )
    : "";

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-cloud">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(98,217,212,.12),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(183,163,255,.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-4xl px-5 py-5 sm:px-8 lg:px-12 lg:py-10">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[0.08] text-sm font-bold text-cyan">P</span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-cloud">Parallax</span>
              <span className="block text-[11px] uppercase tracking-[0.2em] text-mist">Connect the council</span>
            </span>
          </Link>
          <Link href="/" className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist transition hover:border-white/30 hover:text-cloud">Back to demo</Link>
        </header>

        <section className="pt-12">
          <p className="eyebrow text-cyan">10 / MCP surface</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-cloud sm:text-6xl">
            Put your taste council inside the tools you already use.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-mist">
            Create a scoped token for Claude, Cursor, or another MCP client. The connection can ask about eras and convene decisions without exposing raw imports.
          </p>
        </section>

        <section className="surface mt-10 p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
            <label className="text-xs text-mist">
              Connection label
              <input value={label} onChange={(event) => setLabel(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-cloud outline-none focus:border-cyan/40" />
            </label>
            <label className="text-xs text-mist">
              Scope
              <select value={scope} onChange={(event) => setScope(event.target.value as Scope)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-cloud outline-none focus:border-cyan/40">
                <option value="private">Private - full council tools</option>
                <option value="trusted">Trusted - profile and council tools</option>
                <option value="public">Public - era list only</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={() => void createToken()} disabled={busy} className="mt-5 rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#8ae9e5] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
            {busy ? "Working..." : created ? "Create another token" : "Create scoped token"}
          </button>

          {created ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-coral/20 bg-coral/[0.07] p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-coral">Copy once</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all text-xs text-cloud">{created.token}</code>
                  <button type="button" onClick={() => void copyText(created.token, "token")} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-cloud">{copied === "token" ? "Copied" : "Copy"}</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-cloud">Claude / Cursor configuration</p>
                  <button type="button" onClick={() => void copyText(config, "config")} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist">{copied === "config" ? "Copied" : "Copy JSON"}</button>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/20 p-4 text-xs leading-6 text-mist">{config}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void smokeTest()} disabled={busy} className="rounded-full border border-lime/25 bg-lime/10 px-3 py-2 text-xs font-semibold text-lime disabled:opacity-60">Run tools/list smoke test</button>
                <button type="button" onClick={() => void revoke()} disabled={busy} className="rounded-full border border-coral/25 bg-coral/10 px-3 py-2 text-xs font-semibold text-coral disabled:opacity-60">Revoke token</button>
              </div>
            </div>
          ) : null}
          {status ? <p role="status" className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-mist">{status}</p> : null}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="surface p-5">
            <p className="eyebrow text-lilac">Available tools</p>
            <div className="mt-4 space-y-2 text-sm text-cloud">
              {["list_eras", "get_era_profile", "ask_past_self", "convene_council", "compare_eras", "recommend_for_all_selves"].map((tool) => <div key={tool} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 font-mono text-xs">{tool}</div>)}
            </div>
          </div>
          <div className="surface p-5">
            <p className="eyebrow text-lime">Activity log</p>
            {activity.length === 0 ? <p className="mt-4 text-sm leading-6 text-mist">Token creation, smoke tests, and revocation will appear here.</p> : <div className="mt-4 space-y-2">{activity.map((item, index) => <p key={`${item}-${index}`} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-mist">{item}</p>)}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
