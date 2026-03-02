"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generateSessionCode } from "@/lib/utils";
import { painPoints } from "@/config/painPoints";
import LiveResults from "@/components/LiveResults";
import SessionHistory from "@/components/SessionHistory";

export default function PresenterPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionCode, setActiveSessionCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"results" | "history">("results");
  const [copied, setCopied] = useState(false);

  const createSession = useCallback(async () => {
    setCreating(true);
    const code = generateSessionCode();

    const { data, error } = await supabase
      .from("menti_sessions")
      .insert({ code })
      .select("id, code")
      .single();

    if (error || !data) {
      alert("Fout bij het aanmaken van een sessie. Probeer opnieuw.");
      setCreating(false);
      return;
    }

    setActiveSessionId(data.id);
    setActiveSessionCode(data.code);
    setTab("results");
    setCreating(false);
  }, []);

  const endSession = useCallback(async () => {
    if (!activeSessionId) return;
    await supabase
      .from("menti_sessions")
      .update({ is_active: false })
      .eq("id", activeSessionId);

    setActiveSessionId(null);
    setActiveSessionCode(null);
  }, [activeSessionId]);

  const getJoinUrl = () => {
    if (!activeSessionCode) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/join/${activeSessionCode}`;
  };

  const copyLink = async () => {
    const url = getJoinUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCSV = useCallback(async () => {
    if (!activeSessionId) return;

    const { data: allocations } = await supabase
      .from("menti_allocations")
      .select("participant_id, pain_point_id, points")
      .eq("session_id", activeSessionId);

    const { data: participants } = await supabase
      .from("menti_participants")
      .select("id, name")
      .eq("session_id", activeSessionId);

    if (!allocations || !participants) return;

    const participantMap = new Map(participants.map((p) => [p.id, p.name]));
    const painPointMap = new Map(painPoints.map((pp) => [pp.id, pp.name]));

    const rows = [["Deelnemer", "Pijnpunt ID", "Pijnpunt", "Punten"]];
    allocations.forEach((a) => {
      rows.push([
        participantMap.get(a.participant_id) ?? "Onbekend",
        String(a.pain_point_id),
        painPointMap.get(a.pain_point_id) ?? "Onbekend",
        String(a.points),
      ]);
    });

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `menti-sessie-${activeSessionCode}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeSessionId, activeSessionCode]);

  const loadSession = (sessionId: string, code: string) => {
    setActiveSessionId(sessionId);
    setActiveSessionCode(code);
    setTab("results");
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="bg-deloitte-black text-deloitte-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-deloitte-green" />
            <h1 className="text-lg font-bold tracking-tight">
              Deloitte Menti
            </h1>
          </div>
          <span className="text-xs text-deloitte-gray-400 uppercase tracking-wider">
            Presenter
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Session controls */}
        <div className="bg-deloitte-white rounded-2xl shadow-sm border border-deloitte-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-deloitte-black">
                Sessie beheer
              </h2>
              {activeSessionCode ? (
                <p className="text-sm text-deloitte-gray-700 mt-1">
                  Actieve sessie:{" "}
                  <span className="font-mono font-bold text-deloitte-green text-base">
                    {activeSessionCode}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-deloitte-gray-400 mt-1">
                  Geen actieve sessie
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!activeSessionId ? (
                <button
                  onClick={createSession}
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl font-semibold text-deloitte-white bg-deloitte-green hover:bg-deloitte-green-dark disabled:opacity-40 transition-colors"
                >
                  {creating ? "Aanmaken..." : "Nieuwe sessie"}
                </button>
              ) : (
                <>
                  <button
                    onClick={copyLink}
                    className="px-4 py-2.5 rounded-xl font-medium text-sm bg-deloitte-gray-100 hover:bg-deloitte-gray-200 text-deloitte-gray-700 transition-colors"
                  >
                    {copied ? "Gekopieerd!" : "Kopieer link"}
                  </button>
                  <button
                    onClick={exportCSV}
                    className="px-4 py-2.5 rounded-xl font-medium text-sm bg-deloitte-gray-100 hover:bg-deloitte-gray-200 text-deloitte-gray-700 transition-colors"
                  >
                    Exporteer CSV
                  </button>
                  <button
                    onClick={createSession}
                    disabled={creating}
                    className="px-4 py-2.5 rounded-xl font-medium text-sm bg-deloitte-green/10 hover:bg-deloitte-green/20 text-deloitte-green-dark transition-colors"
                  >
                    Nieuwe sessie
                  </button>
                  <button
                    onClick={endSession}
                    className="px-4 py-2.5 rounded-xl font-medium text-sm bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                  >
                    Sessie sluiten
                  </button>
                </>
              )}
            </div>
          </div>

          {activeSessionCode && (
            <div className="mt-4 p-3 bg-deloitte-gray-100 rounded-lg">
              <p className="text-xs text-deloitte-gray-400 mb-1">
                Deelnemerslink
              </p>
              <p className="text-sm font-mono text-deloitte-black break-all">
                {getJoinUrl()}
              </p>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-deloitte-gray-200 rounded-xl p-1">
          <button
            onClick={() => setTab("results")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              tab === "results"
                ? "bg-deloitte-white text-deloitte-black shadow-sm"
                : "text-deloitte-gray-700 hover:text-deloitte-black"
            }`}
          >
            Live resultaten
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              tab === "history"
                ? "bg-deloitte-white text-deloitte-black shadow-sm"
                : "text-deloitte-gray-700 hover:text-deloitte-black"
            }`}
          >
            Sessiegeschiedenis
          </button>
        </div>

        {/* Tab content */}
        <div className="bg-deloitte-white rounded-2xl shadow-sm border border-deloitte-gray-200 p-6">
          {tab === "results" ? (
            activeSessionId ? (
              <LiveResults sessionId={activeSessionId} />
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-deloitte-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-deloitte-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-deloitte-gray-700 mb-1">
                  Geen actieve sessie
                </h3>
                <p className="text-sm text-deloitte-gray-400">
                  Maak een nieuwe sessie aan of selecteer er een uit de
                  geschiedenis.
                </p>
              </div>
            )
          ) : (
            <div>
              <h2 className="text-xl font-bold text-deloitte-black mb-4">
                Sessiegeschiedenis
              </h2>
              <SessionHistory
                onLoadSession={loadSession}
                activeSessionId={activeSessionId}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
