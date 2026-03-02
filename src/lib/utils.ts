export function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getLocalSession() {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("menti_session");
  if (!data) return null;
  try {
    return JSON.parse(data) as {
      sessionCode: string;
      participantId: string;
      participantName: string;
    };
  } catch {
    return null;
  }
}

export function setLocalSession(session: {
  sessionCode: string;
  participantId: string;
  participantName: string;
}) {
  localStorage.setItem("menti_session", JSON.stringify(session));
}

export function clearLocalSession() {
  localStorage.removeItem("menti_session");
}
