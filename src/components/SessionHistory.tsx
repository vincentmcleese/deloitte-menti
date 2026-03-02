"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface SessionRecord {
  id: string;
  code: string;
  created_at: string;
  is_active: boolean;
  participant_count: number;
}

interface SessionHistoryProps {
  onLoadSession: (sessionId: string, code: string) => void;
  activeSessionId: string | null;
}

export default function SessionHistory({
  onLoadSession,
  activeSessionId,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("menti_sessions")
      .select("id, code, created_at, is_active")
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    const withCounts = await Promise.all(
      data.map(async (s) => {
        const { count } = await supabase
          .from("menti_participants")
          .select("id", { count: "exact", head: true })
          .eq("session_id", s.id);
        return { ...s, participant_count: count ?? 0 };
      })
    );

    setSessions(withCounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Weet u zeker dat u deze sessie wilt verwijderen?")) return;

    await supabase.from("menti_sessions").delete().eq("id", sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="text-deloitte-gray-400 text-sm">Laden...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-deloitte-gray-400 text-sm text-center py-8">
        Nog geen sessies aangemaakt.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
            s.id === activeSessionId
              ? "border-deloitte-green bg-deloitte-green/5"
              : "border-deloitte-gray-200 bg-deloitte-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                s.is_active ? "bg-deloitte-green" : "bg-deloitte-gray-400"
              }`}
            />
            <div>
              <span className="font-mono font-bold text-sm text-deloitte-black">
                {s.code}
              </span>
              <p className="text-xs text-deloitte-gray-400">
                {formatDate(s.created_at)} &middot; {s.participant_count}{" "}
                deelnemer{s.participant_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLoadSession(s.id, s.code)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-deloitte-gray-100 hover:bg-deloitte-gray-200 text-deloitte-gray-700 transition-colors"
            >
              Bekijk
            </button>
            <button
              onClick={() => handleDelete(s.id)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
            >
              Verwijder
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
