"use client";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Chip, Skeleton } from "@heroui/react";
import NextLink from "next/link";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");

    return r.json();
  });

function StatCard({
  label,
  value,
  loading,
  href,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  href?: string;
}) {
  const content = (
    <Card className="hover:scale-[1.02] transition-transform cursor-pointer">
      <CardBody className="gap-1">
        <p className="text-sm opacity-60 uppercase tracking-widest">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 rounded-lg" />
        ) : (
          <p className="text-3xl font-bold">{value?.toLocaleString() ?? "—"}</p>
        )}
      </CardBody>
    </Card>
  );

  if (href) {
    return <NextLink href={href}>{content}</NextLink>;
  }

  return content;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useSWR("/api/admin/stats", fetcher);
  const { data: reportsData } = useSWR(
    "/api/admin/reports?status=pending&limit=5",
    fetcher,
  );

  const pendingReports: any[] = reportsData?.reports ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm opacity-50 mt-1">Overview of your platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          href="/admin/users"
          label="Total Users"
          loading={isLoading}
          value={stats?.totalUsers}
        />
        <StatCard
          label="Total Items"
          loading={isLoading}
          value={stats?.totalItems}
        />
        <StatCard
          href="/admin/catalog"
          label="Catalog Size"
          loading={isLoading}
          value={stats?.catalogSize}
        />
        <StatCard
          href="/admin/reports"
          label="Pending Reports"
          loading={isLoading}
          value={stats?.pendingReports}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top brands */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Top Brands by Items</h2>
          </CardHeader>
          <CardBody className="gap-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-lg" />
              ))
            ) : stats?.topBrands?.length > 0 ? (
              stats.topBrands.map((b: any, i: number) => (
                <div
                  key={b.brand ?? i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="opacity-80">{b.brand || "Unknown"}</span>
                  <span className="font-medium">{b.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm opacity-50">No data</p>
            )}
          </CardBody>
        </Card>

        {/* Items by category */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Items by Category</h2>
          </CardHeader>
          <CardBody className="gap-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-lg" />
              ))
            ) : stats?.itemsByCategory?.length > 0 ? (
              stats.itemsByCategory.map((c: any, i: number) => {
                const max = stats.itemsByCategory[0]?.count || 1;
                const pct = Math.round((c.count / max) * 100);

                return (
                  <div key={c.category ?? i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="opacity-80">
                        {c.category || "Unknown"}
                      </span>
                      <span className="font-medium">{c.count}</span>
                    </div>
                    <div className="w-full bg-content2 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm opacity-50">No data</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent pending reports */}
      <Card>
        <CardHeader className="flex justify-between">
          <h2 className="text-base font-semibold">Recent Pending Reports</h2>
          <NextLink
            className="text-sm text-primary hover:underline"
            href="/admin/reports"
          >
            View all
          </NextLink>
        </CardHeader>
        <CardBody>
          {pendingReports.length === 0 ? (
            <p className="text-sm opacity-50">No pending reports</p>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm border-b border-divider pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {r.reason.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs opacity-50">
                      {r.targetType} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Chip color="warning" size="sm" variant="flat">
                    pending
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
