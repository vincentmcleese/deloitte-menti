"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLocalSession, setLocalSession } from "@/lib/utils";
import NameEntry from "@/components/NameEntry";
import VotingForm from "@/components/VotingForm";

export default function JoinPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateSession = useCallback(async () => {
    const { data: session } = await supabase
      .from("menti_sessions")
      .select("id, is_active")
      .eq("code", code)
      .single();

    if (!session) {
      setError("Sessie niet gevonden. Controleer de link.");
      setLoading(false);
      return null;
    }

    if (!session.is_active) {
      setError("Deze sessie is gesloten.");
      setLoading(false);
      return null;
    }

    setSessionId(session.id);
    return session.id;
  }, [code]);

  const restoreSession = useCallback(async () => {
    const local = getLocalSession();
    if (!local || local.sessionCode !== code) {
      setLoading(false);
      return;
    }

    const sid = await validateSession();
    if (!sid) return;

    const { data: participant } = await supabase
      .from("menti_participants")
      .select("id, name")
      .eq("id", local.participantId)
      .eq("session_id", sid)
      .single();

    if (participant) {
      setParticipantId(participant.id);
      setParticipantName(participant.name);
    }
    setLoading(false);
  }, [code, validateSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleJoin = async (name: string) => {
    setJoining(true);

    let sid = sessionId;
    if (!sid) {
      sid = await validateSession();
      if (!sid) {
        setJoining(false);
        return;
      }
    }

    const { data: participant, error: err } = await supabase
      .from("menti_participants")
      .insert({ session_id: sid, name })
      .select("id")
      .single();

    if (err || !participant) {
      setError("Kan niet deelnemen. Probeer het opnieuw.");
      setJoining(false);
      return;
    }

    setLocalSession({
      sessionCode: code,
      participantId: participant.id,
      participantName: name,
    });

    setParticipantId(participant.id);
    setParticipantName(name);
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-deloitte-gray-700">
          <div className="w-5 h-5 border-2 border-deloitte-green border-t-transparent rounded-full animate-spin" />
          Laden...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-deloitte-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-deloitte-black mb-2">Oeps</h2>
          <p className="text-deloitte-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!participantId || !participantName) {
    return (
      <NameEntry onJoin={handleJoin} loading={joining} sessionCode={code} />
    );
  }

  return (
    <VotingForm
      sessionId={sessionId!}
      participantId={participantId}
      participantName={participantName}
      sessionCode={code}
    />
  );
}
