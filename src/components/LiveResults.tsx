"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { painPoints } from "@/config/painPoints";
import { Allocation } from "@/types";

interface LiveResultsProps {
  sessionId: string;
}

interface RankedPoint {
  id: number;
  name: string;
  totalPoints: number;
  avgPoints: number;
  voterCount: number;
}

export default function LiveResults({ sessionId }: LiveResultsProps) {
  const [results, setResults] = useState<RankedPoint[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  const fetchResults = useCallback(async () => {
    const { data: allocations } = await supabase
      .from("menti_allocations")
      .select("pain_point_id, points, participant_id")
      .eq("session_id", sessionId);

    const { count } = await supabase
      .from("menti_participants")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    setParticipantCount(count ?? 0);

    if (!allocations || allocations.length === 0) {
      setResults(
        painPoints.map((pp) => ({
          id: pp.id,
          name: pp.name,
          totalPoints: 0,
          avgPoints: 0,
          voterCount: 0,
        }))
      );
      return;
    }

    const grouped: Record<number, { total: number; voters: Set<string> }> = {};
    painPoints.forEach((pp) => {
      grouped[pp.id] = { total: 0, voters: new Set() };
    });

    (allocations as Allocation[]).forEach((a) => {
      if (grouped[a.pain_point_id]) {
        grouped[a.pain_point_id].total += a.points;
        grouped[a.pain_point_id].voters.add(a.participant_id);
      }
    });

    const ranked = painPoints
      .map((pp) => {
        const g = grouped[pp.id];
        return {
          id: pp.id,
          name: pp.name,
          totalPoints: g.total,
          avgPoints: g.voters.size > 0 ? g.total / g.voters.size : 0,
          voterCount: g.voters.size,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    setResults(ranked);
  }, [sessionId]);

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel(`live-results-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menti_allocations",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchResults();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "menti_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchResults]);

  const maxTotal = Math.max(...results.map((r) => r.totalPoints), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-deloitte-black">
          Live Resultaten
        </h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-deloitte-green/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-deloitte-green animate-pulse" />
          <span className="text-sm font-medium text-deloitte-green-dark">
            {participantCount} deelnemer{participantCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {results.map((r, index) => (
          <div
            key={r.id}
            className="bg-deloitte-white rounded-xl p-4 border border-deloitte-gray-200 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? "bg-deloitte-green text-white"
                      : index === 1
                      ? "bg-deloitte-green/70 text-white"
                      : index === 2
                      ? "bg-deloitte-green/40 text-deloitte-black"
                      : "bg-deloitte-gray-200 text-deloitte-gray-700"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="font-medium text-sm text-deloitte-black leading-tight">
                  {r.name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-bold text-deloitte-green tabular-nums">
                  {r.totalPoints}
                </span>
                <span className="text-xs text-deloitte-gray-400 block">
                  gem. {r.avgPoints.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="h-2 bg-deloitte-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-deloitte-green rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(r.totalPoints / maxTotal) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
