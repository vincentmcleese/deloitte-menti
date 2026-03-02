"use client";

import { useState, useEffect, useCallback } from "react";
import { painPoints } from "@/config/painPoints";
import { supabase } from "@/lib/supabase";
import VotingSlider from "./VotingSlider";

interface VotingFormProps {
  sessionId: string;
  participantId: string;
  participantName: string;
  sessionCode: string;
}

const TOTAL_BUDGET = 100;

export default function VotingForm({
  sessionId,
  participantId,
  participantName,
  sessionCode,
}: VotingFormProps) {
  const [allocations, setAllocations] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    painPoints.forEach((pp) => (init[pp.id] = 0));
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const totalUsed = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = TOTAL_BUDGET - totalUsed;

  const loadExistingAllocations = useCallback(async () => {
    const { data } = await supabase
      .from("menti_allocations")
      .select("pain_point_id, points")
      .eq("participant_id", participantId);

    if (data && data.length > 0) {
      const existing: Record<number, number> = {};
      painPoints.forEach((pp) => (existing[pp.id] = 0));
      data.forEach((row) => {
        existing[row.pain_point_id] = row.points;
      });
      setAllocations(existing);
      setSubmitted(true);
    }
    setLoadingExisting(false);
  }, [participantId]);

  useEffect(() => {
    loadExistingAllocations();
  }, [loadExistingAllocations]);

  const handleSliderChange = (painPointId: number, newValue: number) => {
    const currentValue = allocations[painPointId];
    const otherTotal = totalUsed - currentValue;
    const maxAllowed = TOTAL_BUDGET - otherTotal;
    const clampedValue = Math.min(newValue, maxAllowed);

    setAllocations((prev) => ({ ...prev, [painPointId]: clampedValue }));
  };

  const handleSubmit = async () => {
    if (totalUsed > TOTAL_BUDGET) return;
    setSubmitting(true);

    const rows = painPoints.map((pp) => ({
      session_id: sessionId,
      participant_id: participantId,
      pain_point_id: pp.id,
      points: allocations[pp.id],
    }));

    const { error } = await supabase.from("menti_allocations").upsert(rows, {
      onConflict: "participant_id,pain_point_id",
    });

    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
    } else {
      alert("Er is een fout opgetreden. Probeer het opnieuw.");
    }
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-deloitte-gray-700">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-deloitte-black text-deloitte-white">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-deloitte-green" />
                <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                  Sessie {sessionCode}
                </span>
              </div>
              <p className="text-sm mt-0.5">
                Welkom, <span className="font-semibold">{participantName}</span>
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold tabular-nums ${
                  remaining < 0
                    ? "text-red-400"
                    : remaining === 0
                    ? "text-deloitte-green"
                    : "text-deloitte-white"
                }`}
              >
                {remaining}
              </div>
              <div className="text-[10px] uppercase tracking-wider opacity-70">
                Punten over
              </div>
            </div>
          </div>

          {/* Budget bar */}
          <div className="mt-2 h-1.5 bg-deloitte-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-deloitte-green rounded-full transition-all duration-200"
              style={{ width: `${Math.min((totalUsed / TOTAL_BUDGET) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {submitted && (
          <div className="bg-deloitte-green/10 border border-deloitte-green/30 rounded-xl p-4 text-center">
            <p className="text-deloitte-green-dark font-semibold text-sm">
              Uw stemmen zijn opgeslagen!
            </p>
            <button
              onClick={handleEdit}
              className="mt-2 text-sm text-deloitte-green underline hover:no-underline"
            >
              Stemmen aanpassen
            </button>
          </div>
        )}

        {painPoints.map((pp) => (
          <VotingSlider
            key={pp.id}
            painPoint={pp}
            value={allocations[pp.id]}
            onChange={(v) => handleSliderChange(pp.id, v)}
            disabled={submitted}
          />
        ))}
      </div>

      {/* Submit button */}
      {!submitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-deloitte-white border-t border-deloitte-gray-200 p-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSubmit}
              disabled={submitting || totalUsed > TOTAL_BUDGET}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-deloitte-white bg-deloitte-green hover:bg-deloitte-green-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting
                ? "Bezig met opslaan..."
                : totalUsed > TOTAL_BUDGET
                ? `Te veel punten (${totalUsed}/${TOTAL_BUDGET})`
                : `Stemmen indienen (${totalUsed}/${TOTAL_BUDGET} punten gebruikt)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
