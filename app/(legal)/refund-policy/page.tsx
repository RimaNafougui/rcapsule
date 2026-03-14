import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | rcapsule",
  description: "Our refund and cancellation policy for rcapsule subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
          Refund Policy
        </h1>
        <p className="text-default-500 text-sm">
          Last updated: January 24, 2026
        </p>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Overview
          </h2>
          <p className="text-default-600">
            At rcapsule, we want you to be completely satisfied with your
            Premium subscription. If you&apos;re not happy with your purchase,
            we offer a straightforward refund policy to ensure your peace of
            mind.
          </p>
        </section>

        {/* 7-Day Guarantee */}
        <section className="border border-default-200 p-6 bg-default-50">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
            7-Day Money-Back Guarantee
          </h2>
          <p className="text-default-600 mb-4">
            If you&apos;re not satisfied with rcapsule Premium for any reason,
            you may request a full refund within <strong>7 days</strong> of your
            initial purchase. No questions asked.
          </p>
          <ul className="list-disc list-inside text-default-600 space-y-2">
            <li>Applies to first-time Premium subscriptions only</li>
            <li>Refund must be requested within 7 days of payment</li>
            <li>Full refund of the subscription amount</li>
            <li>Your account will revert to the free plan</li>
          </ul>
        </section>

        {/* How to Request */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            How to Request a Refund
          </h2>
          <p className="text-default-600 mb-4">
            To request a refund, please contact us using one of the following
            methods:
          </p>
          <ol className="list-decimal list-inside text-default-600 space-y-2">
            <li>
              <strong>Email:</strong> Send a request to{" "}
              <a
                className="text-primary underline"
                href="mailto:nafouguirima@gmail.com"
              >
                nafouguirima@gmail.com
              </a>{" "}
              with the subject line &quot;Refund Request&quot;
            </li>
            <li>
              Include your account email address and reason for the refund
              (optional)
            </li>
            <li>We will process your refund within 5-10 business days</li>
          </ol>
        </section>

        {/* Subscription Cancellation */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Subscription Cancellation
          </h2>
          <p className="text-default-600 mb-4">
            You may cancel your Premium subscription at any time through your
            account settings. Here&apos;s what happens when you cancel:
          </p>
          <ul className="list-disc list-inside text-default-600 space-y-2">
            <li>
              Your Premium features remain active until the end of your current
              billing period
            </li>
            <li>No further charges will be made after cancellation</li>
            <li>
              Your account will automatically switch to the free plan when your
              subscription expires
            </li>
            <li>
              Your wardrobe data, items, and outfits are preserved on the free
              plan
            </li>
          </ul>
        </section>

        {/* Refunds After 7 Days */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Refunds After 7 Days
          </h2>
          <p className="text-default-600 mb-4">
            After the 7-day guarantee period, refunds are generally not
            provided. However, we may consider refunds on a case-by-case basis
            for:
          </p>
          <ul className="list-disc list-inside text-default-600 space-y-2">
            <li>Technical issues that prevented use of Premium features</li>
            <li>Accidental duplicate purchases</li>
            <li>Unauthorized transactions (please contact us immediately)</li>
          </ul>
          <p className="text-default-600 mt-4">
            For these situations, please contact{" "}
            <a
              className="text-primary underline"
              href="mailto:nafouguirima@gmail.com"
            >
              nafouguirima@gmail.com
            </a>{" "}
            with details about your situation.
          </p>
        </section>

        {/* Annual Subscriptions */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Annual Subscriptions
          </h2>
          <p className="text-default-600">
            For annual subscriptions, the 7-day money-back guarantee applies
            from the date of purchase. After 7 days, you may cancel at any time
            but will not receive a prorated refund for the remaining months.
            Your Premium access will continue until the end of your annual
            billing period.
          </p>
        </section>

        {/* Payment Processing */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Payment Processing
          </h2>
          <p className="text-default-600">
            Refunds are processed through our payment provider, Stripe. Once
            approved:
          </p>
          <ul className="list-disc list-inside text-default-600 space-y-2 mt-4">
            <li>Credit/debit card refunds: 5-10 business days</li>
            <li>The refund will appear on your original payment method</li>
            <li>
              You will receive an email confirmation when the refund is
              processed
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="border-t border-default-200 pt-8 mt-8">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Questions?
          </h2>
          <p className="text-default-600 mb-4">
            If you have any questions about our refund policy, please don&apos;t
            hesitate to reach out:
          </p>
          <div className="space-y-2 text-default-600">
            <p>
              <strong>Email:</strong>{" "}
              <a
                className="text-primary underline"
                href="mailto:nafouguirima@gmail.com"
              >
                nafouguirima@gmail.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
