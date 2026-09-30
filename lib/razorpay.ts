import crypto from 'node:crypto';

const KEY_ID = () => process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const SECRET = () => process.env.RAZORPAY_KEY_SECRET || '';

export async function createRazorpayOrder(amount: number, receipt: string, notes: Record<string, string>) {
  const auth = Buffer.from(`${KEY_ID()}:${SECRET()}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: 'INR', receipt, notes, payment_capture: 1 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.description || 'Razorpay order failed');
  return data as { id: string; amount: number; currency: string };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', SECRET()).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature || '');
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature || '');
}
