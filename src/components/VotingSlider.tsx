"use client";

import { PainPoint } from "@/types";

interface VotingSliderProps {
  painPoint: PainPoint;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function VotingSlider({
  painPoint,
  value,
  onChange,
  disabled,
}: VotingSliderProps) {
  return (
    <div className="bg-deloitte-white rounded-xl p-4 shadow-sm border border-deloitte-gray-200">
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-deloitte-black text-sm leading-tight">
            {painPoint.id}. {painPoint.name}
          </h3>
          <span className="shrink-0 text-lg font-bold text-deloitte-green tabular-nums min-w-[2.5rem] text-right">
            {value}
          </span>
        </div>
        <p className="text-xs text-deloitte-gray-700 leading-relaxed">
          {painPoint.description}
        </p>
      </div>

      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full disabled:opacity-40"
        />
        <div className="flex justify-between text-[10px] text-deloitte-gray-400 font-medium uppercase tracking-wide">
          <span>Zeer irrelevant</span>
          <span>Zeer relevant</span>
        </div>
      </div>
    </div>
  );
}
