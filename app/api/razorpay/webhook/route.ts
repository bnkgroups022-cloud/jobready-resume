import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { json } from '@/lib/request';

export const dynamic = 'force-dynamic';

// Backup activation: if the user closes the browser right after paying,
// Razorpay still tells us here. Events: payment.captured, order.paid, payment.failed
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature') || '')) {
    return json({ error: 'bad signature' }, 400);
  }
  const evt = JSON.parse(raw);
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
    if (error) return json({ error: error.message }, 500);
  }
  return json({ ok: true });
}
