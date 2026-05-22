import { Metadata } from "next";
import { Divider } from "@heroui/react";

export const metadata: Metadata = {
  title: "Privacy Policy | Rcapsule",
  description:
    "Read how Rcapsule collects, uses, and protects your personal information and wardrobe data.",
  alternates: { canonical: "https://rcapsule.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-display font-light tracking-normal mb-2">
          Privacy Policy
        </h1>
        <p className="text-default-500 text-sm">Last updated: May 2026</p>
      </header>

      <div className="space-y-10 text-sm md:text-base leading-relaxed text-default-700">
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            1. Overview
          </h2>
          <p>
            Rcapsule (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates
            the website at rcapsule.com and the Rcapsule — Wardrobe Import
            Chrome extension. This policy explains what data we collect, why we
            collect it, and how we protect it. By using our services, you agree
            to the practices described here.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            2. Data We Collect
          </h2>

          <h3 className="font-semibold mb-2">Account information</h3>
          <p className="mb-4">
            When you create an account, we collect your email address and a
            display name. If you sign in with Google or GitHub, we receive your
            email and profile name from that provider — we do not receive your
            password.
          </p>

          <h3 className="font-semibold mb-2">Wardrobe data</h3>
          <p className="mb-4">
            Clothing items, outfit collages, collections, wear logs, and any
            photos you upload are stored and associated with your account.
          </p>

          <h3 className="font-semibold mb-2">Community content</h3>
          <p className="mb-4">
            Outfits you choose to publish publicly, comments you post, likes,
            follows, and saves are stored and may be visible to other users.
          </p>

          <h3 className="font-semibold mb-2">Chrome extension</h3>
          <p className="mb-4">
            The extension reads product data (name, brand, price, image URL)
            from the page you are actively viewing{" "}
            <strong>only when you click Scan or Save</strong>. It does not track
            browsing history, run in the background, or read pages you have not
            explicitly triggered it on.
          </p>

          <h3 className="font-semibold mb-2">Payment information</h3>
          <p className="mb-4">
            Subscription payments are handled by Stripe. We never see or store
            your card number. We retain your subscription status and billing
            history.
          </p>

          <h3 className="font-semibold mb-2">Usage and error data</h3>
          <p>
            We use Sentry for error monitoring and Vercel Analytics for
            aggregate traffic analysis. These tools may collect anonymized
            technical data such as browser type, page path, and error
            stacktraces.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            3. Third-Party Services
          </h2>
          <p className="mb-4">
            We work with the following services, each governed by their own
            privacy policy:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-default-600">
            <li>
              <strong>Supabase</strong> — database and file storage (wardrobe
              images)
            </li>
            <li>
              <strong>Stripe</strong> — payment processing
            </li>
            <li>
              <strong>OpenAI / Anthropic</strong> — AI outfit recommendations
              (your wardrobe inventory and weather context are sent; no
              personally identifying information is included in these requests)
            </li>
            <li>
              <strong>OpenWeatherMap</strong> — weather data for outfit
              suggestions (your approximate location if you grant permission)
            </li>
            <li>
              <strong>Loops</strong> — transactional email (account
              confirmation, billing receipts)
            </li>
            <li>
              <strong>Upstash Redis</strong> — session caching and rate limiting
              (no personal data is stored here)
            </li>
            <li>
              <strong>Sentry / Vercel</strong> — error monitoring and
              infrastructure
            </li>
          </ul>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            4. How We Use Your Data
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-default-600">
            <li>To operate and improve the Rcapsule service</li>
            <li>To provide AI outfit recommendations personalized to your wardrobe</li>
            <li>To process subscription payments and send receipts</li>
            <li>To display community content you choose to make public</li>
            <li>To send transactional emails (you cannot opt out of receipts and account security emails; newsletter emails are optional)</li>
            <li>To detect and prevent abuse</li>
          </ul>
          <p className="mt-4">
            We do not sell your data. We do not use your wardrobe data for
            advertising.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            5. Data Retention & Deletion
          </h2>
          <p className="mb-4">
            Your data is retained as long as your account is active. You may
            delete your account at any time from account settings, which will
            permanently delete your wardrobe, outfits, and profile. Community
            content you have posted (public outfits, comments) may take up to 30
            days to be fully removed from all systems.
          </p>
          <p>
            Stripe retains billing records as required by law. Anonymized error
            logs from Sentry are retained for up to 90 days.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            6. Your Rights
          </h2>
          <p className="mb-4">
            Depending on your jurisdiction, you may have the right to access,
            correct, or delete your personal data. To exercise any of these
            rights, contact us at{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="mailto:hello@rcapsule.com"
            >
              hello@rcapsule.com
            </a>
            .
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            7. Children
          </h2>
          <p>
            Rcapsule is not intended for users under 13 years of age. We do not
            knowingly collect personal data from children.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this policy as the product evolves. Significant
            changes will be communicated by email or an in-app notice. Continued
            use of Rcapsule after changes are posted constitutes acceptance of
            the updated policy.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-foreground">
            9. Contact
          </h2>
          <p>
            Questions about this policy? Email us at{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="mailto:hello@rcapsule.com"
            >
              hello@rcapsule.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
