import 'server-only';
import crypto from 'node:crypto';
import { requireEnv } from './env';

// Secrets are read only here, on the server. Never import this file in a client component.
function authHeader() {
  const auth = Buffer.from(`${requireEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID')}:${requireEnv('RAZORPAY_KEY_SECRET')}`).toString('base64');
  return { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };
}

export async function createRazorpayOrder(amount: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ amount, currency: 'INR', receipt, notes, payment_capture: 1 }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status}): ${data?.error?.description || 'unknown error'}`);
  return data as { id: string; amount: number; currency: string };
}

export type RzPayment = { id: string; order_id: string; amount: number; currency: string; status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed' };

// Ask Razorpay directly for the payment (never trust the browser's word).
export async function fetchRazorpayPayment(paymentId: string): Promise<RzPayment> {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: authHeader(), cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Razorpay payment fetch failed (${res.status})`);
  return data as RzPayment;
}

// Only needed if auto-capture is turned off in the Razorpay dashboard.
export async function captureRazorpayPayment(paymentId: string, amount: number): Promise<RzPayment> {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ amount, currency: 'INR' }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Razorpay capture failed (${res.status})`);
  return data as RzPayment;
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', requireEnv('RAZORPAY_KEY_SECRET')).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature || '');
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const expected = crypto.createHmac('sha256', requireEnv('RAZORPAY_WEBHOOK_SECRET')).update(rawBody).digest('hex');
  return safeEqual(expected, signature || '');
}
