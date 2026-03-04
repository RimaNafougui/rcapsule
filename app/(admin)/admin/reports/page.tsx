"use client";
import { useState } from "react";
import useSWR from "swr";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Skeleton,
  Tab,
  Tabs,
} from "@heroui/react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");

    return r.json();
  });

const STATUS_COLOR: Record<
  string,
  "warning" | "success" | "danger" | "default"
> = {
  pending: "warning",
  reviewed: "default",
  resolved: "success",
  dismissed: "danger",
};

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("pending");

  const statusParam = activeTab === "all" ? "" : activeTab;
  const params = new URLSearchParams({
    limit: "100",
    ...(statusParam && { status: statusParam }),
  });

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/reports?${params}`,
    fetcher,
  );

  const reports: any[] = data?.reports ?? [];
  const total: number = data?.total ?? 0;

  async function updateReport(id: string, status: string) {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm opacity-50 mt-1">{total} reports</p>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(k) => setActiveTab(String(k))}
      >
        <Tab key="pending" title="Pending" />
        <Tab key="reviewed" title="Reviewed" />
        <Tab key="resolved" title="Resolved" />
        <Tab key="dismissed" title="Dismissed" />
        <Tab key="all" title="All" />
      </Tabs>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider">
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Reporter
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Target
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Reason
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Description
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-divider">
                    <td className="px-4 py-3" colSpan={7}>
                      <Skeleton className="h-6 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center opacity-50" colSpan={7}>
                    No reports found.
                  </td>
                </tr>
              ) : (
                reports.map((r: any) => (
                  <tr
                    key={r.id}
                    className="border-b border-divider hover:bg-content2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.reporter?.name || "—"}</p>
                      <p className="text-xs opacity-50">{r.reporter?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Chip size="sm" variant="flat">
                        {r.targetType}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {r.reason.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      <p className="truncate text-xs opacity-70">
                        {r.description || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Chip
                        color={STATUS_COLOR[r.status] ?? "default"}
                        size="sm"
                        variant="flat"
                      >
                        {r.status}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 opacity-60 whitespace-nowrap text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            color="success"
                            size="sm"
                            variant="flat"
                            onPress={() => updateReport(r.id, "resolved")}
                          >
                            Resolve
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            onPress={() => updateReport(r.id, "dismissed")}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                      {r.status !== "pending" && (
                        <span className="text-xs opacity-40">
                          Reviewed{" "}
                          {r.reviewedAt
                            ? new Date(r.reviewedAt).toLocaleDateString()
                            : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
