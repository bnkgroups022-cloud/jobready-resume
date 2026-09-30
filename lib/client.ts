'use client';
import type { ProductKey } from './pricing';
import type { ResumeData } from './types';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem('jr_device');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`).replace(/[^a-zA-Z0-9-]/g, '');
      localStorage.setItem('jr_device', id);
    }
    return id;
  } catch {
    return '';
  }
}

const DRAFT_KEY = 'jr_draft_v1';
export function saveDraft(d: ResumeData, step: number) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, step })); } catch {}
}
export function loadDraft(): { d: ResumeData; step: number } | null {
  try { const v = localStorage.getItem(DRAFT_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// Opens Razorpay checkout. Resolves true when payment is verified & activated.
export async function startCheckout(product: ProductKey): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product }),
  });
  const order = await r.json();
  if (r.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return { ok: false };
  }
  if (!r.ok) return { ok: false, error: order.error };
  const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  if (!loaded) return { ok: false, error: 'Could not load payment page. Check your internet.' };

  return new Promise((resolve) => {
    const rz = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: 'INR',
      name: process.env.NEXT_PUBLIC_APP_NAME || 'JobReady Resume',
      description: order.productName,
      order_id: order.orderId,
      prefill: order.prefill,
      theme: { color: '#2553e0' },
      handler: async (resp: any) => {
        const v = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resp),
        });
        const vj = await v.json().catch(() => ({}));
        resolve(v.ok && vj.ok ? { ok: true } : { ok: false, error: vj.error || 'Verification failed' });
      },
      modal: { ondismiss: () => resolve({ ok: false }) },
    });
    // On failure Razorpay shows the error and lets the user retry inside the popup.
    rz.open();
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const fileSafe = (s: string) => (s || 'Resume').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
