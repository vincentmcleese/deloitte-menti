export interface PainPoint {
  id: number;
  name: string;
  description: string;
}

export interface Session {
  id: string;
  code: string;
  created_at: string;
  is_active: boolean;
}

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  created_at: string;
}

export interface Allocation {
  id: string;
  session_id: string;
  participant_id: string;
  pain_point_id: number;
  points: number;
  created_at: string;
}

export interface LocalSession {
  sessionCode: string;
  participantId: string;
  participantName: string;
}
