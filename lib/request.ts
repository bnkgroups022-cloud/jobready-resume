import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export function ipHash(req: Request): string | null {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + (process.env.ABUSE_SALT || 'jobready')).digest('hex').slice(0, 32);
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function cleanDevice(v: unknown): string | null {
  return typeof v === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(v) ? v : null;
}
