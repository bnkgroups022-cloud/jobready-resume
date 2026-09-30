import { getUser, supabaseAdmin } from '@/lib/supabase/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { json } from '@/lib/request';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
  const { data: pay } = await db.from('payments').select('user_id').eq('razorpay_order_id', orderId).maybeSingle();
  if (!pay || pay.user_id !== user.id) return json({ error: 'Order not found.' }, 404);

  const { error } = await db.rpc('fulfill_payment', { p_order_id: orderId, p_payment_id: paymentId });
  if (error) {
    console.error('fulfill', error);
    return json({ error: 'Payment received but activation failed. Contact support with ID ' + paymentId }, 500);
  }
  return json({ ok: true });
}
