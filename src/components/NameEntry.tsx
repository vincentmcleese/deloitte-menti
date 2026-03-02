"use client";

import { useState } from "react";

interface NameEntryProps {
  onJoin: (name: string) => void;
  loading: boolean;
  sessionCode: string;
}

export default function NameEntry({ onJoin, loading, sessionCode }: NameEntryProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-deloitte-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-deloitte-green" />
            <span className="text-sm font-semibold tracking-wider uppercase text-deloitte-gray-700">
              Deloitte
            </span>
          </div>
          <h1 className="text-2xl font-bold text-deloitte-black mb-2">
            Welkom bij de sessie
          </h1>
          <p className="text-deloitte-gray-700">
            Sessiecode:{" "}
            <span className="font-mono font-bold text-deloitte-green">
              {sessionCode}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-deloitte-gray-700 mb-1"
            >
              Uw naam
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vul uw naam in"
              className="w-full px-4 py-3 rounded-lg border border-deloitte-gray-200 focus:outline-none focus:ring-2 focus:ring-deloitte-green focus:border-transparent text-deloitte-gray-900 placeholder:text-deloitte-gray-400"
              autoFocus
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-3 px-4 rounded-lg font-semibold text-deloitte-white bg-deloitte-green hover:bg-deloitte-green-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Even geduld..." : "Deelnemen"}
          </button>
        </form>
      </div>
    </div>
  );
}
