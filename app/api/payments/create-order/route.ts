import { getUser, supabaseAdmin } from '@/lib/supabase/server';
import { PRODUCTS, type ProductKey } from '@/lib/pricing';
import { createRazorpayOrder } from '@/lib/razorpay';
import { json } from '@/lib/request';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return json({ error: 'Please login first.', code: 'LOGIN' }, 401);
  const body = await req.json().catch(() => null);
  const product = body?.product as ProductKey;
  if (!PRODUCTS[product]) return json({ error: 'Invalid plan.' }, 400);

  const db = supabaseAdmin();
  // abuse protection: max 10 payment attempts per hour
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from('payments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since);
  if ((count ?? 0) >= 10) return json({ error: 'Too many payment attempts. Please try after some time.' }, 429);

  const { amount } = PRODUCTS[product];
  try {
    const order = await createRazorpayOrder(amount, `jr_${Date.now()}`, { user_id: user.id, product });
    const { error } = await db.from('payments').insert({
      user_id: user.id, amount, product, payment_type: 'one_time', razorpay_order_id: order.id, status: 'created',
    });
    if (error) throw error;
    const { data: prof } = await db.from('profiles').select('name, mobile').eq('id', user.id).maybeSingle();
    return json({
      orderId: order.id,
      amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      productName: PRODUCTS[product].name,
      prefill: { name: prof?.name || '', email: user.email || '', contact: prof?.mobile || '' },
    });
  } catch (e: any) {
    console.error('create-order', e);
    return json({ error: 'Payment could not be started. Please try again.' }, 500);
  }
}
