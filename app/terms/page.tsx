import Policy from '@/components/Policy';
export const metadata = { title: 'Terms & Conditions' };
export default function Page() {
  return (
    <Policy title="Terms & Conditions">
      <p>By using {process.env.NEXT_PUBLIC_APP_NAME || 'JobReady Resume'} (“we”, “the service”) you agree to these terms.</p>
      <h2>Service</h2>
      <p>We provide an online tool to create resumes. The first resume is free for each person/device. Additional resumes cost ₹9 each, or you can buy Pro Monthly (₹49 for 30 days) or Pro Yearly (₹399 for 365 days). Pro plans are one-time payments and do not auto-renew.</p>
      <h2>Fair use</h2>
      <p>“Unlimited” resumes under Pro means unlimited for your personal job applications. Automated, bulk or commercial resume generation is not allowed. We may rate-limit or block accounts that misuse the service, create multiple accounts to get free resumes, or attempt to abuse the system.</p>
      <h2>Your content</h2>
      <p>You are responsible for the accuracy of the details you enter. Do not add false qualifications or experience. The “Am I Ready for This Job?” check is only a qualification and skill match for guidance; it does not guarantee any job, interview or selection.</p>
      <h2>Changes</h2>
      <p>We may update prices, features or these terms. Changes apply from the date they are published on this page.</p>
    </Policy>
  );
}
