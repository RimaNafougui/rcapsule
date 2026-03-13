export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 font-sans">
      <h1 className="text-3xl font-black uppercase mb-8">Privacy Policy</h1>

      <p className="mb-4 text-sm text-gray-500">Last Updated: January 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">1. Overview</h2>
        <p className="text-gray-700 leading-relaxed">
          The Capsule Extension (&quot;we&quot;, &quot;us&quot;) is designed to help you save
          clothing items from third-party websites to your personal digital
          wardrobe. We respect your privacy and only collect data necessary to
          perform this function.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">2. Data We Collect</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          When you use the extension, we collect the following information{" "}
          <strong>only when you click &quot;Save&quot;</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            <strong>Product URLs:</strong> To link back to the item.
          </li>
          <li>
            <strong>Product Images & Metadata:</strong> (Name, Price, Brand) to
            display in your closet.
          </li>
          <li>
            <strong>User ID:</strong> To ensure the item is saved to{" "}
            <em>your</em> specific account.
          </li>
        </ul>
        <p className="text-gray-700 mt-4">
          We <strong>do not</strong> track your browsing history, keystrokes, or
          personal data on websites other than the product pages you explicitly
          choose to save.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">3. How We Use Your Data</h2>
        <p className="text-gray-700 leading-relaxed">
          The data is sent directly to your Capsule database stored on Supabase.
          It is used solely for the purpose of organizing your digital wardrobe.
          We do not sell your data to third parties.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">4. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          If you have questions about this policy, please contact us at
          rimanafougui99@gmail.com.
        </p>
      </section>
    </div>
  );
}
