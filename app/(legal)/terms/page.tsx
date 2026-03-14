import { Divider } from "@heroui/react";

export default function TermsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
          Terms & Privacy
        </h1>
        <p className="text-default-500 text-sm uppercase tracking-widest">
          Last Updated: January 2024
        </p>
      </div>

      <div className="space-y-12 text-sm md:text-base leading-relaxed text-default-700">
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            1. User Content
          </h2>
          <p>
            You retain full ownership of the photos and data you upload to the
            platform. By uploading content, you grant us a license to store and
            display these images solely for your personal use within the
            application. We do not sell your personal wardrobe data to third
            parties.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            2. Auto-Import Tool
          </h2>
          <p className="mb-4">
            Our &quot;Auto-Import&quot; feature is provided as a convenience
            tool. It retrieves publicly available metadata (images, prices,
            descriptions) from product URLs provided by you.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-default-500">
            <li>
              We are not affiliated with the retailers or brands you import
              from.
            </li>
            <li>
              We do not guarantee that the importer will work for every website,
              as site structures change frequently.
            </li>
            <li>
              You agree to use this feature only for personal organization
              purposes.
            </li>
          </ul>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            3. Acceptable Use
          </h2>
          <p>
            You agree not to misuse the platform. This includes, but is not
            limited to: uploading illegal content, attempting to reverse
            engineer the scraping logic, or using the service to harass others.
          </p>
        </section>

        <Divider />

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            4. Limitation of Liability
          </h2>
          <p>
            The service is provided &quot;as is.&quot; We are not liable for any
            data loss or service interruptions. While we strive for 99% uptime
            and secure backups, we encourage you to keep copies of important
            data.
          </p>
        </section>
      </div>
    </div>
  );
}
