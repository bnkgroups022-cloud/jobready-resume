import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { json } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Production URL: https://resume.brightwayjobs.in/api/razorpay/webhook
// Events: payment.captured, order.paid, payment.failed
// Backup activation if the user closes the browser right after paying.
export async function POST(req: Request) {
  const raw = await req.text(); // raw body is required for signature check
  let valid = false;
  try {
    valid = verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature') || '');
  } catch (e: any) {
    console.error('webhook config:', e?.message); // e.g. RAZORPAY_WEBHOOK_SECRET missing
    return json({ error: 'webhook not configured' }, 500);
  }
  if (!valid) return json({ error: 'bad signature' }, 400);

  let evt: any;
  try { evt = JSON.parse(raw); } catch { return json({ error: 'bad json' }, 400); }
  const payment = evt?.payload?.payment?.entity;
  const orderId: string | undefined = payment?.order_id || evt?.payload?.order?.entity?.id;
  if (!orderId || !payment?.id) return json({ ok: true });

  const db = supabaseAdmin();
  const { data: row } = await db.from('payments').select('id, amount').eq('razorpay_order_id', orderId).maybeSingle();
  if (!row) return json({ ok: true }); // not our order

  if (evt.event === 'payment.failed') {
    await db.from('payments').update({ status: 'failed' }).eq('id', row.id).eq('fulfilled', false);
    return json({ ok: true });
  }
  if ((evt.event === 'payment.captured' || evt.event === 'order.paid') && Number(payment.amount) === row.amount) {
    const { error } = await db.rpc('fulfill_payment', { p_order_id: orderId, p_payment_id: payment.id });
    if (error) {
      console.error('webhook fulfill_payment:', error.message);
      return json({ error: 'fulfil failed' }, 500); // Razorpay will retry
    }
  }
  return json({ ok: true });
}
