import Policy from '@/components/Policy';
export const metadata = { title: 'Privacy Policy' };
export default function Page() {
  return (
    <Policy title="Privacy Policy">
      <p>{process.env.NEXT_PUBLIC_APP_NAME || 'JobReady Resume'} respects your privacy.</p>
      <h2>What we collect</h2>
      <p>Account details (name, email, mobile), the resume details you enter, and payment records (we never see or store your card/UPI details — payments are processed by Razorpay). For abuse protection we store a random device ID and a one-way hashed version of your IP address.</p>
      <h2>How we use it</h2>
      <p>Only to create and store your resumes, manage your plan, prevent misuse and provide support. We do not sell your personal data.</p>
      <h2>Your control</h2>
      <p>You can delete any resume from “My Resumes”. To delete your account, contact us from your registered email.</p>
    </Policy>
  );
}
