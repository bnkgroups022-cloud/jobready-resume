import Policy from '@/components/Policy';
export const metadata = { title: 'Refund & Cancellation Policy' };
export default function Page() {
  return (
    <Policy title="Refund & Cancellation Policy">
      <p>All our products are digital and delivered instantly after payment.</p>
      <h2>Resume credit (₹9)</h2>
      <p>Once the credit is used to generate a resume, it cannot be refunded. If your payment was deducted but the credit was not added, contact us within 7 days with your payment ID and we will add the credit or refund the amount.</p>
      <h2>Pro plans (₹49 / ₹399)</h2>
      <p>Pro plans are one-time payments and do not auto-renew, so there is nothing to cancel. If the plan was not activated after a successful payment, contact us within 7 days for activation or a full refund.</p>
      <h2>Refund timeline</h2>
      <p>Approved refunds are processed to the original payment method within 5–7 working days.</p>
    </Policy>
  );
}
