import { redirect } from "next/navigation";
import NextLink from "next/link";

import { auth } from "@/auth";

const adminNavItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Catalogue", href: "/admin/catalogue" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Broadcast", href: "/admin/broadcast" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-divider bg-content1 flex flex-col">
        <div className="px-4 py-5 border-b border-divider">
          <span className="eyebrow text-default-400">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {adminNavItems.map((item) => (
            <NextLink
              key={item.href}
              className="px-3 py-2 text-sm font-light hover:bg-content2 transition-colors"
              href={item.href}
            >
              {item.label}
            </NextLink>
          ))}
        </nav>
        <div className="p-3 border-t border-divider">
          <NextLink
            className="px-3 py-2 text-sm font-light hover:bg-content2 transition-colors block opacity-60"
            href="/"
          >
            Back to App
          </NextLink>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
