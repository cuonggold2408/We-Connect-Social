import { Request } from 'express';

export function extractClientInfo(req: Request) {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress;

  const deviceInfo = req.headers['user-agent'];

  return {
    ipAddress,
    deviceInfo,
  };
}
