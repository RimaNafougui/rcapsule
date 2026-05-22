import { Metadata } from "next";
import { Divider } from "@heroui/react";

export const metadata: Metadata = {
  title: "Terms of Service | Rcapsule",
  description:
    "Review the terms and conditions that govern your use of Rcapsule, including acceptable use, subscriptions, and your rights.",
  alternates: { canonical: "https://rcapsule.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-display font-light tracking-normal mb-2">
          Terms of Service
        </h1>
        <p className="text-default-500 text-sm uppercase tracking-widest">
          Last Updated: May 2026
        </p>
      </header>

      <div className="space-y-12 text-sm md:text-base leading-relaxed text-default-700">
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            1. Acceptance
          </h2>
          <p>
            By creating an account or using Rcapsule (&quot;the Service&quot;),
            you agree to these Terms of Service. If you do not agree, do not use
            the Service. These terms apply to the web application at
            rcapsule.com and the Rcapsule — Wardrobe Import Chrome extension.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            2. Accounts
          </h2>
          <p className="mb-4">
            You must provide accurate information when creating an account. You
            are responsible for maintaining the security of your credentials and
            for all activity that occurs under your account.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms, at our sole discretion, without prior notice.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            3. User Content
          </h2>
          <p className="mb-4">
            You retain full ownership of the photos and data you upload to the
            platform. By uploading content, you grant us a limited license to
            store, display, and (for content you make public) show it to other
            users of Rcapsule. We do not sell your personal wardrobe data to
            third parties.
          </p>
          <p>
            You are responsible for ensuring the content you upload does not
            infringe the rights of others. We may remove content that violates
            these terms or applicable law.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            4. Community Features
          </h2>
          <p className="mb-4">
            Rcapsule includes a community discover feed where users may
            optionally publish outfits, post comments, follow other users, and
            interact with public content. By making an outfit or profile public,
            you agree it may be visible to any visitor of the platform.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-default-500">
            <li>Do not post content that is hateful, abusive, or harassing.</li>
            <li>
              Do not impersonate other users or brands.
            </li>
            <li>
              Do not post spam, promotional content, or affiliate links without
              disclosure.
            </li>
          </ul>
          <p className="mt-4">
            We reserve the right to remove content or restrict access to
            community features for violations.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            5. Auto-Import & Chrome Extension
          </h2>
          <p className="mb-4">
            The Auto-Import feature and Chrome extension retrieve publicly
            available metadata (images, prices, descriptions) from product pages
            you choose to import.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-default-500">
            <li>
              We are not affiliated with the retailers or brands you import
              from.
            </li>
            <li>
              We do not guarantee accuracy for every website, as site structures
              change frequently.
            </li>
            <li>
              You agree to use this feature for personal organization purposes
              only, not for bulk data collection or commercial use.
            </li>
          </ul>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            6. Subscriptions & Billing
          </h2>
          <p className="mb-4">
            Rcapsule offers a free plan and a paid Premium subscription billed
            monthly or annually. By subscribing, you authorize us to charge your
            payment method on a recurring basis until you cancel.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-default-500">
            <li>
              You may cancel at any time from your account settings. Cancellation
              takes effect at the end of the current billing period.
            </li>
            <li>
              Refunds are governed by our{" "}
              <a
                className="text-foreground underline underline-offset-4"
                href="/refund-policy"
              >
                Refund Policy
              </a>
              .
            </li>
            <li>
              We reserve the right to change pricing with 30 days&apos; notice.
            </li>
          </ul>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            7. Acceptable Use
          </h2>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2 text-default-500">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
            <li>
              Use automated tools to scrape, crawl, or bulk-extract data from
              the platform
            </li>
            <li>Interfere with the availability or integrity of the Service</li>
            <li>Upload malicious code or files</li>
          </ul>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            8. Intellectual Property
          </h2>
          <p>
            The Rcapsule name, logo, product design, and underlying code are our
            property. Nothing in these terms grants you a right to use our
            trademarks or copy our software.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            9. Limitation of Liability
          </h2>
          <p>
            The Service is provided &quot;as is.&quot; We are not liable for any
            indirect, incidental, or consequential damages, including data loss
            or service interruptions. Our total liability to you for any claim
            will not exceed the amount you paid us in the 12 months prior to the
            claim.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            10. Changes to These Terms
          </h2>
          <p>
            We may update these terms as the product evolves. We will notify you
            of material changes by email or in-app notice. Continued use of
            Rcapsule after changes are posted constitutes acceptance.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            11. Contact
          </h2>
          <p>
            Questions about these terms? Email{" "}
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
