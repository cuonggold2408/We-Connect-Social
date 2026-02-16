import dotenv from 'dotenv';
dotenv.config();

export function getCookieConfig(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeMs,
  };
}
