export const PRESENCE_KEYS = {
  onlineSet: 'presence:online',
  userSockets: (uid: string) => `presence:user:${uid}:sockets`,
  socketAlive: (sid: string) => `presence:socket:${sid}`,
  lastSeen: (uid: string) => `presence:lastSeen:${uid}`,
} as const;

export const PRESENCE_TTL = {
  socketAliveSec: 60,
  userSocketsSec: 90,
  onlineSetSec: 120,
  lastSeenSec: 60 * 60 * 24 * 30,
} as const;

export const PRESENCE_INTERVAL = {
  heartbeatMs: 30000,
  reconcilerMs: 30000,
  lastSeenFlushMs: 60000,
} as const;
