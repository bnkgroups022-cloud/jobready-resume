import { getUser, supabaseAdmin } from '@/lib/supabase/server';
import { captureRazorpayPayment, fetchRazorpayPayment, verifyPaymentSignature } from '@/lib/razorpay';
import { json } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Called by the browser after Razorpay checkout. Activation happens only after:
// 1) HMAC signature check with the server-side secret, 2) the order belongs to
// this user, 3) Razorpay's own API confirms the payment is captured for the
// same order and amount. The webhook is a second, independent path.
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return json({ error: 'Please login first.' }, 401);
    const b = await req.json().catch(() => null);
    const orderId = String(b?.razorpay_order_id || '');
    const paymentId = String(b?.razorpay_payment_id || '');
    const signature = String(b?.razorpay_signature || '');
    if (!orderId || !paymentId || !verifyPaymentSignature(orderId, paymentId, signature)) {
      return json({ error: 'Payment verification failed.' }, 400);
    }

    const db = supabaseAdmin();
    const { data: row } = await db.from('payments').select('user_id, amount, fulfilled').eq('razorpay_order_id', orderId).maybeSingle();
    if (!row || row.user_id !== user.id) return json({ error: 'Order not found.' }, 404);
    if (row.fulfilled) return json({ ok: true });

    let p = await fetchRazorpayPayment(paymentId);
    if (p.order_id !== orderId || Number(p.amount) !== row.amount) return json({ error: 'Payment does not match this order.' }, 400);
    if (p.status === 'authorized') p = await captureRazorpayPayment(paymentId, row.amount);
    if (p.status !== 'captured') {
      return json({ error: 'Payment is still processing. Your plan will activate automatically in a few minutes.' }, 202);
    }

    const { error } = await db.rpc('fulfill_payment', { p_order_id: orderId, p_payment_id: paymentId });
    if (error) {
      console.error('fulfill_payment failed:', error.message);
      return json({ error: 'Payment received but activation failed. Contact support with ID ' + paymentId }, 500);
    }
    return json({ ok: true });
  } catch (e: any) {
    console.error('payments/verify:', e?.message);
    return json({ error: 'Could not confirm payment right now. If money was deducted, it will activate automatically shortly.' }, 500);
  }
}
