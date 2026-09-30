import Policy from '@/components/Policy';
export const metadata = { title: 'Contact Us' };
export default function Page() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
  const wa = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '').replace(/\D/g, '');
  return (
    <Policy title="Contact Us">
      <p>Need help with your resume or payment? We usually reply within 24 hours.</p>
      {email && <p>Email: <a className="text-brand-600" href={`mailto:${email}`}>{email}</a></p>}
      {wa && <p>WhatsApp: <a className="text-brand-600" href={`https://wa.me/${wa}`}>+{wa}</a></p>}
      <p>For payment issues, please share your Razorpay payment ID (starts with “pay_”).</p>
    </Policy>
  );
}
