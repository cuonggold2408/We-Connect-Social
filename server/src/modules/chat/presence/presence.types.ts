export interface PresenceSnapshot {
  onlineUserIds: string[];
  lastSeen: Record<string, string | null>;
}

export interface PresenceDelta {
  becameOffline: string[];
  becameOnline: string[];
}
